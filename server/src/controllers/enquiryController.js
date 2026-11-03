const Enquiry = require('../models/Enquiry');
const Property = require('../models/Property');
const FoodProvider = require('../models/FoodProvider');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/error');
const { notify } = require('../utils/notify');
const { sendEmail } = require('../utils/mailer');

async function findListing(listingType, listingId) {
  if (listingType === 'property') {
    return Property.findById(listingId);
  }
  return FoodProvider.findById(listingId);
}

const createEnquiry = asyncHandler(async (req, res) => {
  const { listingType, listingId, name, email, phone, message } = req.body;
  const listing = await findListing(listingType, listingId);
  if (!listing || listing.status !== 'approved') {
    throw new AppError('This listing is not available for enquiries.', 404);
  }

  const recipient =
    listingType === 'property' ? listing.owner : listing.user;

  if (recipient.toString() === req.user._id.toString()) {
    throw new AppError('You cannot send an enquiry about your own listing.', 400);
  }

  const recent = await Enquiry.findOne({
    user: req.user._id,
    listingType,
    listingId,
    createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) }
  });
  if (recent) {
    throw new AppError(
      'You already sent an enquiry for this listing minutes ago. Please wait before sending another.',
      429
    );
  }

  const enquiry = await Enquiry.create({
    user: req.user._id,
    recipient,
    listingType,
    listingId: listing._id,
    listingName: listingType === 'property' ? listing.name : listing.businessName,
    name,
    email,
    phone,
    message
  });

  await notify({
    user: recipient,
    type: 'enquiry',
    title: 'New customer enquiry',
    message: `${name} enquired about "${enquiry.listingName}".`,
    link: listingType === 'property' ? '/owner/enquiries' : '/provider/enquiries'
  });

  const recipientUser = await User.findById(recipient);
  if (recipientUser) {
    sendEmail({
      to: recipientUser.email,
      subject: `New StayMate enquiry for ${enquiry.listingName}`,
      text: `${name} (${email}${phone ? `, ${phone}` : ''}) sent an enquiry:\n\n${message}\n\nLog in to StayMate to respond.`
    }).catch(() => {});
  }

  res.status(201).json({ success: true, enquiry });
});

const myEnquiries = asyncHandler(async (req, res) => {
  const items = await Enquiry.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json({
    success: true,
    items: items.map((item) => ({
      ...item.toObject(),
      link: item.listingType === 'property' ? `/accommodations/${item.listingId}` : `/food/${item.listingId}`
    }))
  });
});

const receivedEnquiries = asyncHandler(async (req, res) => {
  const items = await Enquiry.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(200);
  res.json({
    success: true,
    items: items.map((item) => ({
      ...item.toObject(),
      link: item.listingType === 'property' ? `/accommodations/${item.listingId}` : `/food/${item.listingId}`
    }))
  });
});

const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['new', 'contacted', 'closed'].includes(status)) {
    throw new AppError('Invalid status.', 400);
  }
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) throw new AppError('Enquiry not found.', 404);
  if (req.user.role !== 'admin' && !enquiry.recipient.equals(req.user._id)) {
    throw new AppError('You can only manage enquiries sent to you.', 403);
  }

  enquiry.status = status;
  await enquiry.save();

  if (status === 'contacted') {
    await notify({
      user: enquiry.user,
      type: 'enquiry_status',
      title: 'Your enquiry was answered',
      message: `The provider for "${enquiry.listingName}" marked your enquiry as contacted. You can now leave a verified review.`,
      link: enquiry.listingType === 'property' ? `/accommodations/${enquiry.listingId}` : `/food/${enquiry.listingId}`
    });
  }

  res.json({ success: true, enquiry });
});

module.exports = { createEnquiry, myEnquiries, receivedEnquiries, updateEnquiryStatus };
