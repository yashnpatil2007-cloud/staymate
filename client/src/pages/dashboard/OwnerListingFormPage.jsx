import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, Image as ImageIcon, Info, MapPin, Save, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import ImageUploader from '../../components/ImageUploader';
import { PageLoading } from '../../components/Skeletons';
import {
  AMENITY_LABELS,
  FURNISHING_LABELS,
  OCCUPANCY_LABELS,
  PROPERTY_TYPE_LABELS
} from '../../utils/format';

const EMPTY = {
  name: '',
  description: '',
  type: 'pg',
  city: '',
  area: '',
  address: '',
  collegeNearby: '',
  workplaceNearby: '',
  rent: '',
  deposit: '',
  genderPreference: 'any',
  furnishing: 'unfurnished',
  occupancy: 'single',
  totalBeds: 1,
  availableBeds: 1,
  amenities: [],
  houseRules: '',
  images: [],
  availabilityNote: '',
  lat: '',
  lng: ''
};

export default function OwnerListingFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  usePageMeta(editing ? 'Edit Property' : 'Add Property', 'Create or update a StayMate property listing.');
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return;
    api
      .get(`/properties/${id}`)
      .then(({ data }) => {
        const property = data.property;
        setForm({
          name: property.name || '',
          description: property.description || '',
          type: property.type || 'pg',
          city: property.city || '',
          area: property.area || '',
          address: property.address || '',
          collegeNearby: property.collegeNearby || '',
          workplaceNearby: property.workplaceNearby || '',
          rent: property.rent ?? '',
          deposit: property.deposit ?? '',
          genderPreference: property.genderPreference || 'any',
          furnishing: property.furnishing || 'unfurnished',
          occupancy: property.occupancy || 'single',
          totalBeds: property.totalBeds ?? 1,
          availableBeds: property.availableBeds ?? 1,
          amenities: property.amenities || [],
          houseRules: (property.houseRules || []).join('\n'),
          images: property.images || [],
          availabilityNote: property.availabilityNote || '',
          lat: property.coordinates?.lat ?? '',
          lng: property.coordinates?.lng ?? ''
        });
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [editing, id]);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const toggleAmenity = (amenity) => {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity]
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (Number(form.availableBeds) > Number(form.totalBeds)) {
      setError('Available beds cannot exceed total beds.');
      return;
    }
    const hasLat = form.lat !== '' && form.lat !== null;
    const hasLng = form.lng !== '' && form.lng !== null;
    if (hasLat !== hasLng) {
      setError('Enter both latitude and longitude, or leave both blank.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      city: form.city.trim(),
      area: form.area.trim(),
      address: form.address.trim(),
      collegeNearby: form.collegeNearby.trim(),
      workplaceNearby: form.workplaceNearby.trim(),
      coordinates: hasLat && hasLng ? { lat: Number(form.lat), lng: Number(form.lng) } : null,
      rent: Number(form.rent),
      deposit: Number(form.deposit || 0),
      genderPreference: form.genderPreference,
      furnishing: form.furnishing,
      occupancy: form.occupancy,
      totalBeds: Number(form.totalBeds),
      availableBeds: Number(form.availableBeds),
      amenities: form.amenities,
      houseRules: form.houseRules.split('\n').map((rule) => rule.trim()).filter(Boolean).slice(0, 15),
      images: form.images,
      availabilityNote: form.availabilityNote.trim()
    };
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/properties/${id}`, payload);
        toast.success('Listing updated.');
      } else {
        await api.post('/properties', payload);
        toast.success('Listing submitted for review.');
      }
      navigate('/owner/listings');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <>
      <div className="dash-page-head">
        <div>
          <Link to="/owner/listings" className="back-link"><ArrowLeft size={14} /> Back to my listings</Link>
          <h2>{editing ? 'Edit property' : 'Add a property'}</h2>
          <p>{editing ? 'Keep details accurate so customers know exactly what to expect. Changes appear on your public listing immediately.' : 'New listings are reviewed by an administrator before going live.'}</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="form-layout">
          <div className="dash-stack">
            <section className="form-card">
              <div className="form-section-head">
                <span className="form-section-icon"><Building2 size={17} /></span>
                <div>
                  <h3>Basic details</h3>
                  <p>The name and type customers see first.</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="field form-full">
                  <label htmlFor="property-name">Property name *</label>
                  <input id="property-name" className="input" value={form.name} onChange={(event) => set('name', event.target.value)} required minLength={3} maxLength={120} placeholder="e.g. Sunrise Residency" />
                </div>
                <div className="field">
                  <label htmlFor="property-type">Property type *</label>
                  <select id="property-type" className="select" value={form.type} onChange={(event) => set('type', event.target.value)}>
                    {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="property-gender">Gender preference</label>
                  <select id="property-gender" className="select" value={form.genderPreference} onChange={(event) => set('genderPreference', event.target.value)}>
                    <option value="any">Any gender</option>
                    <option value="male">Male only</option>
                    <option value="female">Female only</option>
                  </select>
                </div>
                <div className="field form-full">
                  <label htmlFor="property-description">Description *</label>
                  <textarea id="property-description" className="textarea" rows={5} value={form.description} onChange={(event) => set('description', event.target.value)} required minLength={30} maxLength={4000} placeholder="Describe the property, rooms, neighbourhood and what makes it a good stay." />
                  <span className="field-hint">At least 30 characters. {form.description.length}/4000</span>
                </div>
              </div>
            </section>

            <section className="form-card">
              <div className="form-section-head">
                <span className="form-section-icon"><MapPin size={17} /></span>
                <div>
                  <h3>Location</h3>
                  <p>Exact address stays private until a customer enquires.</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="property-city">City *</label>
                  <input id="property-city" className="input" value={form.city} onChange={(event) => set('city', event.target.value)} required minLength={2} maxLength={80} placeholder="Bengaluru" />
                </div>
                <div className="field">
                  <label htmlFor="property-area">Area / locality *</label>
                  <input id="property-area" className="input" value={form.area} onChange={(event) => set('area', event.target.value)} required minLength={2} maxLength={120} placeholder="Koramangala" />
                </div>
                <div className="field form-full">
                  <label htmlFor="property-address">Full address *</label>
                  <input id="property-address" className="input" value={form.address} onChange={(event) => set('address', event.target.value)} required minLength={5} maxLength={300} placeholder="Building, street, landmark" />
                </div>
                <div className="field">
                  <label htmlFor="property-college">Nearby college</label>
                  <input id="property-college" className="input" value={form.collegeNearby} onChange={(event) => set('collegeNearby', event.target.value)} maxLength={160} placeholder="Optional" />
                </div>
                <div className="field">
                  <label htmlFor="property-workplace">Nearby workplace</label>
                  <input id="property-workplace" className="input" value={form.workplaceNearby} onChange={(event) => set('workplaceNearby', event.target.value)} maxLength={160} placeholder="Optional" />
                </div>
                <div className="field">
                  <label htmlFor="property-lat">Latitude</label>
                  <input id="property-lat" className="input" type="number" step="any" value={form.lat} onChange={(event) => set('lat', event.target.value)} placeholder="Optional" />
                </div>
                <div className="field">
                  <label htmlFor="property-lng">Longitude</label>
                  <input id="property-lng" className="input" type="number" step="any" value={form.lng} onChange={(event) => set('lng', event.target.value)} placeholder="Optional" />
                </div>
              </div>
              <p className="field-hint" style={{ marginTop: 8 }}>Coordinates power the map on your listing. Leave blank to show the locality only.</p>
            </section>

            <section className="form-card">
              <div className="form-section-head">
                <span className="form-section-icon"><ShieldCheck size={17} /></span>
                <div>
                  <h3>Pricing, beds and amenities</h3>
                  <p>Accurate availability avoids cancelled visits.</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="property-rent">Monthly rent (₹) *</label>
                  <input id="property-rent" className="input" type="number" min="0" value={form.rent} onChange={(event) => set('rent', event.target.value)} required placeholder="12000" />
                </div>
                <div className="field">
                  <label htmlFor="property-deposit">Security deposit (₹)</label>
                  <input id="property-deposit" className="input" type="number" min="0" value={form.deposit} onChange={(event) => set('deposit', event.target.value)} placeholder="0" />
                </div>
                <div className="field">
                  <label htmlFor="property-total-beds">Total beds *</label>
                  <input id="property-total-beds" className="input" type="number" min="1" max="100" value={form.totalBeds} onChange={(event) => set('totalBeds', event.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="property-available-beds">Available beds *</label>
                  <input id="property-available-beds" className="input" type="number" min="0" max="100" value={form.availableBeds} onChange={(event) => set('availableBeds', event.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="property-occupancy">Occupancy</label>
                  <select id="property-occupancy" className="select" value={form.occupancy} onChange={(event) => set('occupancy', event.target.value)}>
                    {Object.entries(OCCUPANCY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="property-furnishing">Furnishing</label>
                  <select id="property-furnishing" className="select" value={form.furnishing} onChange={(event) => set('furnishing', event.target.value)}>
                    {Object.entries(FURNISHING_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="field form-full">
                  <label>Amenities</label>
                  <div className="chip-check-grid">
                    {Object.entries(AMENITY_LABELS).map(([value, label]) => (
                      <label className={`chip-check ${form.amenities.includes(value) ? 'checked' : ''}`} key={value}>
                        <input type="checkbox" checked={form.amenities.includes(value)} onChange={() => toggleAmenity(value)} />
                        <CheckCircle2 size={14} /> {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="property-availability-note">Availability note</label>
                  <input id="property-availability-note" className="input" value={form.availabilityNote} onChange={(event) => set('availabilityNote', event.target.value)} maxLength={200} placeholder="e.g. Available from 1 Dec" />
                </div>
                <div className="field form-full">
                  <label htmlFor="property-rules">House rules</label>
                  <textarea id="property-rules" className="textarea" rows={4} value={form.houseRules} onChange={(event) => set('houseRules', event.target.value)} placeholder={'One rule per line\nNo smoking indoors\nQuiet hours after 11 PM'} />
                  <span className="field-hint">One rule per line, up to 15 rules.</span>
                </div>
              </div>
            </section>

            <section className="form-card">
              <div className="form-section-head">
                <span className="form-section-icon"><ImageIcon size={17} /></span>
                <div>
                  <h3>Photos</h3>
                  <p>Use real photos of the actual property. At least one image is required.</p>
                </div>
              </div>
              <ImageUploader value={form.images} onChange={(images) => set('images', images)} max={8} label="Property photos *" />
            </section>
          </div>

          <aside className="form-side">
            <div className="form-side-card sticky">
              <h3>Before you publish</h3>
              <ul className="side-points">
                <li><CheckCircle2 size={15} /> Use the exact rent and deposit — no hidden charges.</li>
                <li><CheckCircle2 size={15} /> Upload real photos, not stock images.</li>
                <li><CheckCircle2 size={15} /> Keep available beds current.</li>
                <li><CheckCircle2 size={15} /> Listings are checked by an admin.</li>
              </ul>
              <div className="alert alert-info" style={{ marginTop: 14 }}>
                <Info size={15} />
                <span className="small">You can edit your listing later from My listings.</span>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={saving} style={{ marginTop: 14 }}>
                <Save size={15} /> {saving ? 'Saving…' : editing ? 'Save changes' : 'Submit for review'}
              </button>
              <Link to="/owner/listings" className="btn btn-ghost btn-block" style={{ marginTop: 8 }}>Cancel</Link>
            </div>
          </aside>
        </div>
      </form>
    </>
  );
}
