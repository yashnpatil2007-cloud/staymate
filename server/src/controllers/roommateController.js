const RoommateProfile = require('../models/RoommateProfile');
const RoommateRequest = require('../models/RoommateRequest');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { AppError } = require('../middleware/error');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { calculateCompatibility } = require('../utils/compatibility');
const { notify } = require('../utils/notify');

function publicUser(user) {
  if (!user) return null;
  return {
    id: user._id,
    name: user.name,
    avatar: user.avatar || '',
    city: user.city || '',
    bio: user.bio || '',
    isDemo: user.isDemo
  };
}

function profileCard(profile, viewerProfile) {
  const data = profile.toObject();
  const compatibility = viewerProfile
    ? calculateCompatibility(viewerProfile, profile)
    : { score: null, breakdown: [] };
  return {
    id: data._id,
    user: publicUser(data.user),
    age: data.age,
    gender: data.gender,
    city: data.city,
    locality: data.locality,
    budgetMin: data.budgetMin,
    budgetMax: data.budgetMax,
    occupation: data.occupation,
    collegeOrCompany: data.collegeOrCompany,
    accommodationType: data.accommodationType,
    foodPreference: data.foodPreference,
    sleepSchedule: data.sleepSchedule,
    smoking: data.smoking,
    cleanliness: data.cleanliness,
    lifestyle: data.lifestyle,
    preferredGender: data.preferredGender,
    bio: data.bio,
    createdAt: data.createdAt,
    compatibility: compatibility.score,
    compatibilityBreakdown: compatibility.breakdown
  };
}

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await RoommateProfile.findOne({ user: req.user._id }).populate(
    'user',
    'name avatar city bio isDemo'
  );
  res.json({ success: true, profile: profile ? profileCard(profile) : null });
});

const upsertMyProfile = asyncHandler(async (req, res) => {
  let profile = await RoommateProfile.findOne({ user: req.user._id });
  if (profile) {
    Object.assign(profile, req.body);
    await profile.save();
  } else {
    profile = await RoommateProfile.create({ ...req.body, user: req.user._id });
  }
  await RoommateProfile.populate(profile, { path: 'user', select: 'name avatar city bio isDemo' });
  res.json({ success: true, profile: profileCard(profile) });
});

const listRoommates = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 12);
  const viewerProfile = await RoommateProfile.findOne({ user: req.user._id });
  const query = {
    isVisible: true,
    user: { $ne: req.user._id }
  };

  const { city, locality, budgetMin, budgetMax, occupation, foodPreference, accommodationType, gender, sleepSchedule, q, minCompatibility } = req.query;

  if (city) query.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
  if (locality) query.locality = new RegExp(escapeRegex(locality), 'i');
  if (occupation) query.occupation = occupation;
  if (foodPreference) query.foodPreference = foodPreference;
  if (accommodationType) query.accommodationType = accommodationType;
  if (gender) query.gender = gender;
  if (sleepSchedule) query.sleepSchedule = sleepSchedule;
  if (budgetMin) query.budgetMax = { $gte: Number(budgetMin) };
  if (budgetMax) query.budgetMin = { ...(query.budgetMin || {}), $lte: Number(budgetMax) };
  if (q) {
    const term = new RegExp(escapeRegex(q), 'i');
    query.$or = [{ bio: term }, { locality: term }, { collegeOrCompany: term }];
  }

  if (viewerProfile) {
    if (viewerProfile.preferredGender !== 'any') {
      query.gender = viewerProfile.preferredGender;
    }
    query.$and = [];
    query.$and.push({
      $or: [
        { preferredGender: 'any' },
        { preferredGender: viewerProfile.gender },
        ...(viewerProfile.preferredGender === 'any' ? [] : [{ gender: viewerProfile.preferredGender }])
      ]
    });
  }

  const profiles = await RoommateProfile.find(query)
    .populate('user', 'name avatar city bio isDemo isActive')
    .limit(300);

  let cards = profiles
    .filter((profile) => profile.user && profile.user.isActive)
    .map((profile) => profileCard(profile, viewerProfile));

  if (minCompatibility && viewerProfile) {
    cards = cards.filter((card) => card.compatibility >= Number(minCompatibility));
  }

  cards.sort((a, b) => {
    if (a.compatibility !== null && b.compatibility !== null && a.compatibility !== b.compatibility) {
      return b.compatibility - a.compatibility;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const total = cards.length;
  const items = cards.slice(skip, skip + limit);

  const incoming = await RoommateRequest.find({ from: req.user._id, status: 'pending' }).select('to');
  const pendingSet = new Set(incoming.map((request) => request.to.toString()));

  res.json({
    success: true,
    items: items.map((card) => ({
      ...card,
      requestPending: pendingSet.has(card.user.id.toString())
    })),
    viewerHasProfile: Boolean(viewerProfile),
    pagination: paginationMeta(total, page, limit)
  });
});

const getRoommate = asyncHandler(async (req, res) => {
  const profile = await RoommateProfile.findById(req.params.id).populate(
    'user',
    'name avatar city bio isDemo'
  );
  if (!profile || !profile.isVisible) throw new AppError('Roommate profile not found.', 404);
  const viewerProfile = await RoommateProfile.findOne({ user: req.user._id });
  const existingRequest = await RoommateRequest.findOne({
    from: req.user._id,
    to: profile.user._id
  });
  res.json({
    success: true,
    profile: profileCard(profile, viewerProfile),
    viewerHasProfile: Boolean(viewerProfile),
    request: existingRequest
      ? { id: existingRequest._id, status: existingRequest.status }
      : null
  });
});

async function hydratedRequests(requests, direction, viewerId) {
  const otherIds = requests.map((request) =>
    direction === 'received' ? request.from : request.to
  );
  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: otherIds } }).select('name avatar city isDemo phone email'),
    RoommateProfile.find({ user: { $in: otherIds } })
  ]);
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));
  const profileMap = new Map(profiles.map((profile) => [profile.user.toString(), profile]));
  const viewerProfile = await RoommateProfile.findOne({ user: viewerId });

  return requests.map((request) => {
    const otherId = direction === 'received' ? request.from : request.to;
    const other = userMap.get(otherId.toString());
    const profile = profileMap.get(otherId.toString());
    const compatibility =
      viewerProfile && profile ? calculateCompatibility(viewerProfile, profile) : { score: null };
    return {
      id: request._id,
      status: request.status,
      message: request.message,
      createdAt: request.createdAt,
      respondedAt: request.respondedAt,
      user: other
        ? {
            id: other._id,
            name: other.name,
            avatar: other.avatar || '',
            city: other.city || '',
            isDemo: other.isDemo,
            ...(request.status === 'accepted'
              ? { phone: other.phone || '', email: other.email }
              : {})
          }
        : null,
      profile: profile ? { id: profile._id, city: profile.city, occupation: profile.occupation, budgetMin: profile.budgetMin, budgetMax: profile.budgetMax } : null,
      compatibility: compatibility.score
    };
  });
}

const sendRequest = asyncHandler(async (req, res) => {
  let { toUserId, targetProfileId, message } = req.body;
  if (!toUserId && targetProfileId) {
    const profile = await RoommateProfile.findById(targetProfileId);
    if (profile) toUserId = profile.user.toString();
  }
  if (!toUserId) {
    throw new AppError('Recipient not found.', 404);
  }
  if (toUserId === req.user._id.toString()) {
    throw new AppError('You cannot send a roommate request to yourself.', 400);
  }
  const [recipient, recipientProfile, myProfile] = await Promise.all([
    User.findById(toUserId),
    RoommateProfile.findOne({ user: toUserId }),
    RoommateProfile.findOne({ user: req.user._id })
  ]);
  if (!recipient || !recipient.isActive) throw new AppError('User not found.', 404);
  if (!recipientProfile || !recipientProfile.isVisible) {
    throw new AppError('This user is not accepting roommate requests.', 400);
  }
  if (!myProfile) {
    throw new AppError('Create your roommate profile before sending requests.', 400);
  }

  let request = await RoommateRequest.findOne({ from: req.user._id, to: recipient._id });
  if (request) {
    if (request.status === 'accepted') throw new AppError('You are already connected.', 409);
    if (request.status === 'pending') throw new AppError('A request is already pending.', 409);
    request.status = 'pending';
    request.message = message;
    request.respondedAt = undefined;
    await request.save();
  } else {
    request = await RoommateRequest.create({
      from: req.user._id,
      to: recipient._id,
      message
    });
  }

  await notify({
    user: recipient._id,
    type: 'roommate_request',
    title: 'New roommate request',
    message: `${req.user.name} sent you a roommate request.`,
    link: '/dashboard/requests'
  });

  res.status(201).json({ success: true, request });
});

const respondRequest = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!['accept', 'reject'].includes(action)) {
    throw new AppError('Invalid action.', 400);
  }
  const request = await RoommateRequest.findById(req.params.id);
  if (!request) throw new AppError('Request not found.', 404);
  if (!request.to.equals(req.user._id)) {
    throw new AppError('You can only respond to requests sent to you.', 403);
  }
  if (request.status !== 'pending') {
    throw new AppError('This request has already been handled.', 400);
  }

  request.status = action === 'accept' ? 'accepted' : 'rejected';
  request.respondedAt = new Date();
  await request.save();

  await notify({
    user: request.from,
    type: 'request_response',
    title: action === 'accept' ? 'Roommate request accepted' : 'Roommate request declined',
    message:
      action === 'accept'
        ? `${req.user.name} accepted your roommate request. You can now see their contact details.`
        : `${req.user.name} declined your roommate request.`,
    link: '/dashboard/connections'
  });

  res.json({ success: true, request });
});

const cancelRequest = asyncHandler(async (req, res) => {
  const request = await RoommateRequest.findById(req.params.id);
  if (!request) throw new AppError('Request not found.', 404);
  if (!request.from.equals(req.user._id)) {
    throw new AppError('You can only cancel requests you sent.', 403);
  }
  if (request.status !== 'pending') {
    throw new AppError('Only pending requests can be cancelled.', 400);
  }
  request.status = 'cancelled';
  await request.save();
  res.json({ success: true, request });
});

const getReceivedRequests = asyncHandler(async (req, res) => {
  const requests = await RoommateRequest.find({ to: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, items: await hydratedRequests(requests, 'received', req.user._id) });
});

const getSentRequests = asyncHandler(async (req, res) => {
  const requests = await RoommateRequest.find({ from: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, items: await hydratedRequests(requests, 'sent', req.user._id) });
});

const getConnections = asyncHandler(async (req, res) => {
  const requests = await RoommateRequest.find({
    status: 'accepted',
    $or: [{ from: req.user._id }, { to: req.user._id }]
  }).sort({ updatedAt: -1 });

  const items = await Promise.all(
    requests.map(async (request) => {
      const isSender = request.from.equals(req.user._id);
      const otherId = isSender ? request.to : request.from;
      const other = await User.findById(otherId).select('name avatar city phone email isDemo');
      const profile = await RoommateProfile.findOne({ user: otherId });
      return {
        requestId: request.id,
        connectedAt: request.respondedAt || request.updatedAt,
        user: other
          ? {
              id: other._id,
              name: other.name,
              avatar: other.avatar || '',
              city: other.city || '',
              phone: other.phone || '',
              email: other.email,
              isDemo: other.isDemo
            }
          : null,
        profile: profile
          ? {
              id: profile._id,
              occupation: profile.occupation,
              budgetMin: profile.budgetMin,
              budgetMax: profile.budgetMax
            }
          : null
      };
    })
  );

  res.json({ success: true, items: items.filter((item) => item.user) });
});

module.exports = {
  getMyProfile,
  upsertMyProfile,
  listRoommates,
  getRoommate,
  sendRequest,
  respondRequest,
  cancelRequest,
  getReceivedRequests,
  getSentRequests,
  getConnections
};
