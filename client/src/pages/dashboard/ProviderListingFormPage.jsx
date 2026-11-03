import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChefHat,
  CheckCircle2,
  Image as ImageIcon,
  Info,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
  UtensilsCrossed
} from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import ImageUploader from '../../components/ImageUploader';
import Modal from '../../components/Modal';
import { PageLoading } from '../../components/Skeletons';
import { FOOD_TYPE_LABELS, MEAL_LABELS, formatCurrency } from '../../utils/format';

const EMPTY = {
  businessName: '',
  description: '',
  type: 'mess',
  city: '',
  area: '',
  address: '',
  pricePerMonth: '',
  mealAvailability: ['lunch', 'dinner'],
  foodType: 'veg',
  menu: '',
  phone: '',
  images: []
};

const EMPTY_PLAN = {
  name: '',
  description: '',
  pricePerMonth: '',
  mealsIncluded: ['lunch', 'dinner'],
  foodType: 'veg',
  menu: '',
  isActive: true
};

export default function ProviderListingFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  usePageMeta(editing ? 'Edit Food Service' : 'Add Food Service', 'Create or update a StayMate food listing.');
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [planModal, setPlanModal] = useState(false);
  const [planEditing, setPlanEditing] = useState(null);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN);
  const [planError, setPlanError] = useState('');
  const [planSaving, setPlanSaving] = useState(false);
  const [planDeleting, setPlanDeleting] = useState(null);
  const [planBusy, setPlanBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api
      .get('/food/mine')
      .then(({ data }) => {
        const food = data.items.find((item) => item._id === id);
        if (!food) throw new Error('Food service not found.');
        setForm({
          businessName: food.businessName || '',
          description: food.description || '',
          type: food.type || 'mess',
          city: food.city || '',
          area: food.area || '',
          address: food.address || '',
          pricePerMonth: food.pricePerMonth ?? '',
          mealAvailability: food.mealAvailability || [],
          foodType: food.foodType || 'veg',
          menu: food.menu || '',
          phone: food.phone || '',
          images: food.images || []
        });
        setMealPlans(food.mealPlans || []);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [editing, id]);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const toggleMeal = (meal) => {
    setForm((current) => ({
      ...current,
      mealAvailability: current.mealAvailability.includes(meal)
        ? current.mealAvailability.filter((item) => item !== meal)
        : [...current.mealAvailability, meal]
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.mealAvailability.length === 0) {
      setError('Select at least one meal you serve.');
      return;
    }
    const payload = {
      businessName: form.businessName.trim(),
      description: form.description.trim(),
      type: form.type,
      city: form.city.trim(),
      area: form.area.trim(),
      address: form.address.trim(),
      pricePerMonth: Number(form.pricePerMonth),
      mealAvailability: form.mealAvailability,
      foodType: form.foodType,
      menu: form.menu.trim(),
      phone: form.phone.trim(),
      images: form.images
    };
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/food/${id}`, payload);
        toast.success('Food service updated.');
      } else {
        await api.post('/food', payload);
        toast.success('Food service submitted for review.');
      }
      navigate('/provider/listings');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const openPlanModal = (plan = null) => {
    setPlanEditing(plan);
    setPlanForm(plan ? {
      name: plan.name,
      description: plan.description || '',
      pricePerMonth: plan.pricePerMonth ?? '',
      mealsIncluded: plan.mealsIncluded || [],
      foodType: plan.foodType || 'veg',
      menu: plan.menu || '',
      isActive: plan.isActive !== false
    } : EMPTY_PLAN);
    setPlanError('');
    setPlanModal(true);
  };

  const togglePlanMeal = (meal) => {
    setPlanForm((current) => ({
      ...current,
      mealsIncluded: current.mealsIncluded.includes(meal)
        ? current.mealsIncluded.filter((item) => item !== meal)
        : [...current.mealsIncluded, meal]
    }));
  };

  const savePlan = async (event) => {
    event.preventDefault();
    setPlanError('');
    if (planForm.mealsIncluded.length === 0) {
      setPlanError('Select at least one meal for this plan.');
      return;
    }
    const payload = {
      name: planForm.name.trim(),
      description: planForm.description.trim(),
      pricePerMonth: Number(planForm.pricePerMonth),
      mealsIncluded: planForm.mealsIncluded,
      foodType: planForm.foodType,
      menu: planForm.menu.trim(),
      isActive: planForm.isActive
    };
    setPlanSaving(true);
    try {
      if (planEditing) {
        const { data } = await api.patch(`/food/${id}/plans/${planEditing._id}`, payload);
        setMealPlans((current) => current.map((item) => (item._id === data.mealPlan._id ? data.mealPlan : item)));
        toast.success('Meal plan updated.');
      } else {
        const { data } = await api.post(`/food/${id}/plans`, payload);
        setMealPlans((current) => [...current, data.mealPlan]);
        toast.success('Meal plan added.');
      }
      setPlanModal(false);
    } catch (saveError) {
      setPlanError(saveError.message);
    } finally {
      setPlanSaving(false);
    }
  };

  const deletePlan = async () => {
    if (!planDeleting) return;
    setPlanBusy(true);
    try {
      await api.delete(`/food/${id}/plans/${planDeleting._id}`);
      setMealPlans((current) => current.filter((item) => item._id !== planDeleting._id));
      toast.success('Meal plan deleted.');
      setPlanDeleting(null);
    } catch (deleteError) {
      toast.error(deleteError.message);
    } finally {
      setPlanBusy(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <>
      <div className="dash-page-head">
        <div>
          <Link to="/provider/listings" className="back-link"><ArrowLeft size={14} /> Back to my services</Link>
          <h2>{editing ? 'Edit food service' : 'Add a food service'}</h2>
          <p>{editing ? 'Keep your menu and pricing current so customers know what to expect.' : 'New services are reviewed by an administrator before going live.'}</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="form-layout">
          <div className="dash-stack">
            <section className="form-card">
              <div className="form-section-head">
                <span className="form-section-icon"><ChefHat size={17} /></span>
                <div>
                  <h3>Service details</h3>
                  <p>Tell customers what kind of food service you run.</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="field form-full">
                  <label htmlFor="food-name">Business name *</label>
                  <input id="food-name" className="input" value={form.businessName} onChange={(event) => set('businessName', event.target.value)} required minLength={3} maxLength={120} placeholder="e.g. Ghar Ka Khana Tiffins" />
                </div>
                <div className="field">
                  <label htmlFor="food-type">Service type *</label>
                  <select id="food-type" className="select" value={form.type} onChange={(event) => set('type', event.target.value)}>
                    {Object.entries(FOOD_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="food-preference">Food preference *</label>
                  <select id="food-preference" className="select" value={form.foodType} onChange={(event) => set('foodType', event.target.value)}>
                    <option value="veg">Vegetarian only</option>
                    <option value="non_veg">Non-vegetarian</option>
                    <option value="both">Veg & non-veg</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="food-price">Monthly price (₹) *</label>
                  <input id="food-price" className="input" type="number" min="0" value={form.pricePerMonth} onChange={(event) => set('pricePerMonth', event.target.value)} required placeholder="3500" />
                </div>
                <div className="field">
                  <label htmlFor="food-phone">Contact phone</label>
                  <input id="food-phone" className="input" value={form.phone} onChange={(event) => set('phone', event.target.value)} maxLength={20} placeholder="Optional" />
                </div>
                <div className="field form-full">
                  <label>Meals served *</label>
                  <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    {Object.entries(MEAL_LABELS).map(([value, label]) => (
                      <label className={`chip-check ${form.mealAvailability.includes(value) ? 'checked' : ''}`} key={value}>
                        <input type="checkbox" checked={form.mealAvailability.includes(value)} onChange={() => toggleMeal(value)} />
                        <CheckCircle2 size={14} /> {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="field form-full">
                  <label htmlFor="food-description">Description *</label>
                  <textarea id="food-description" className="textarea" rows={5} value={form.description} onChange={(event) => set('description', event.target.value)} required minLength={30} maxLength={3000} placeholder="Describe your food, portion sizes, delivery area and how the service works." />
                  <span className="field-hint">At least 30 characters. {form.description.length}/3000</span>
                </div>
                <div className="field form-full">
                  <label htmlFor="food-menu">Sample menu</label>
                  <textarea id="food-menu" className="textarea" rows={4} value={form.menu} onChange={(event) => set('menu', event.target.value)} maxLength={2000} placeholder={'Mon: dal, rice, roti, sabzi\nTue: rajma, rice, roti, salad'} />
                  <span className="field-hint">A weekly or rotating menu helps customers decide.</span>
                </div>
              </div>
            </section>

            <section className="form-card">
              <div className="form-section-head">
                <span className="form-section-icon"><MapPin size={17} /></span>
                <div>
                  <h3>Location</h3>
                  <p>Where you cook and deliver from.</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="food-city">City *</label>
                  <input id="food-city" className="input" value={form.city} onChange={(event) => set('city', event.target.value)} required minLength={2} maxLength={80} placeholder="Bengaluru" />
                </div>
                <div className="field">
                  <label htmlFor="food-area">Area / locality *</label>
                  <input id="food-area" className="input" value={form.area} onChange={(event) => set('area', event.target.value)} required minLength={2} maxLength={120} placeholder="Koramangala" />
                </div>
                <div className="field form-full">
                  <label htmlFor="food-address">Address / delivery area</label>
                  <input id="food-address" className="input" value={form.address} onChange={(event) => set('address', event.target.value)} maxLength={300} placeholder="Optional — e.g. delivers within 4 km of Koramangala" />
                </div>
              </div>
            </section>

            <section className="form-card">
              <div className="form-section-head">
                <span className="form-section-icon"><ImageIcon size={17} /></span>
                <div>
                  <h3>Photos</h3>
                  <p>Real photos of the food and kitchen. At least one image is required.</p>
                </div>
              </div>
              <ImageUploader value={form.images} onChange={(images) => set('images', images)} max={8} label="Food photos *" />
            </section>

            {editing && (
              <section className="form-card">
                <div className="form-section-head" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <div className="row" style={{ gap: 10 }}>
                    <span className="form-section-icon"><UtensilsCrossed size={17} /></span>
                    <div>
                      <h3>Meal plans</h3>
                      <p>Optional packages shown on your public listing.</p>
                    </div>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => openPlanModal()}>
                    <Plus size={14} /> Add plan
                  </button>
                </div>
                {mealPlans.length === 0 ? (
                  <p className="small muted">No meal plans yet. Add optional weekly or monthly packages with their own price and menu.</p>
                ) : (
                  <div className="meal-plan-grid">
                    {mealPlans.map((plan) => (
                      <article className="meal-plan-card" key={plan._id}>
                        <div className="row-between" style={{ gap: 8 }}>
                          <h4>{plan.name}</h4>
                          {!plan.isActive && <span className="badge badge-neutral">Hidden</span>}
                        </div>
                        <p className="meal-plan-price">{formatCurrency(plan.pricePerMonth)}<span>/month</span></p>
                        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                          {plan.mealsIncluded.map((meal) => <span className="meal-chip" key={meal}>{MEAL_LABELS[meal] || meal}</span>)}
                        </div>
                        {plan.description && <p className="small muted">{plan.description}</p>}
                        <div className="row" style={{ gap: 6, marginTop: 'auto', paddingTop: 8 }}>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => openPlanModal(plan)}><Pencil size={13} /> Edit</button>
                          <button type="button" className="icon-btn danger" onClick={() => setPlanDeleting(plan)} aria-label={`Delete ${plan.name}`}><Trash2 size={14} /></button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="form-side">
            <div className="form-side-card sticky">
              <h3>Before you publish</h3>
              <ul className="side-points">
                <li><CheckCircle2 size={15} /> Show real food photos and honest portion sizes.</li>
                <li><CheckCircle2 size={15} /> State the monthly price clearly.</li>
                <li><CheckCircle2 size={15} /> List the meals and delivery area.</li>
                <li><CheckCircle2 size={15} /> Listings are checked by an admin.</li>
              </ul>
              <div className="alert alert-info" style={{ marginTop: 14 }}>
                <Info size={15} />
                <span className="small">
                  {editing ? 'Meal plans can be added and edited on this page.' : 'You can add meal plans after saving the service.'}
                </span>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={saving} style={{ marginTop: 14 }}>
                <Save size={15} /> {saving ? 'Saving…' : editing ? 'Save changes' : 'Submit for review'}
              </button>
              <Link to="/provider/listings" className="btn btn-ghost btn-block" style={{ marginTop: 8 }}>Cancel</Link>
            </div>
          </aside>
        </div>
      </form>

      <Modal
        open={planModal}
        onClose={() => (planSaving ? null : setPlanModal(false))}
        title={planEditing ? 'Edit meal plan' : 'Add meal plan'}
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setPlanModal(false)} disabled={planSaving}>Cancel</button>
            <button type="submit" form="meal-plan-form" className="btn btn-primary" disabled={planSaving}>
              {planSaving ? 'Saving…' : planEditing ? 'Save plan' : 'Add plan'}
            </button>
          </>
        )}
      >
        <form id="meal-plan-form" className="stack" onSubmit={savePlan}>
          {planError && <div className="alert alert-error">{planError}</div>}
          <div className="field">
            <label htmlFor="plan-name">Plan name *</label>
            <input id="plan-name" className="input" value={planForm.name} onChange={(event) => setPlanForm({ ...planForm, name: event.target.value })} required minLength={2} maxLength={120} placeholder="e.g. Lunch + dinner monthly" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="plan-price">Monthly price (₹) *</label>
              <input id="plan-price" className="input" type="number" min="0" value={planForm.pricePerMonth} onChange={(event) => setPlanForm({ ...planForm, pricePerMonth: event.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="plan-food-type">Food preference</label>
              <select id="plan-food-type" className="select" value={planForm.foodType} onChange={(event) => setPlanForm({ ...planForm, foodType: event.target.value })}>
                <option value="veg">Vegetarian</option>
                <option value="non_veg">Non-vegetarian</option>
                <option value="both">Veg & non-veg</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Meals included *</label>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(MEAL_LABELS).map(([value, label]) => (
                <label className={`chip-check ${planForm.mealsIncluded.includes(value) ? 'checked' : ''}`} key={value}>
                  <input type="checkbox" checked={planForm.mealsIncluded.includes(value)} onChange={() => togglePlanMeal(value)} />
                  <CheckCircle2 size={14} /> {label}
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="plan-description">Description</label>
            <textarea id="plan-description" className="textarea" rows={2} value={planForm.description} onChange={(event) => setPlanForm({ ...planForm, description: event.target.value })} maxLength={1000} placeholder="What this plan includes" />
          </div>
          <div className="field">
            <label htmlFor="plan-menu">Plan menu</label>
            <textarea id="plan-menu" className="textarea" rows={3} value={planForm.menu} onChange={(event) => setPlanForm({ ...planForm, menu: event.target.value })} maxLength={2000} placeholder="Sample menu for this plan" />
          </div>
          <label className="switch-row">
            <input type="checkbox" checked={planForm.isActive} onChange={(event) => setPlanForm({ ...planForm, isActive: event.target.checked })} />
            <span>Show this plan on my public listing</span>
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(planDeleting)}
        onClose={() => (planBusy ? null : setPlanDeleting(null))}
        title="Delete meal plan?"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setPlanDeleting(null)} disabled={planBusy}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={deletePlan} disabled={planBusy}>{planBusy ? 'Deleting…' : 'Delete plan'}</button>
          </>
        )}
      >
        <p className="muted"><strong>{planDeleting?.name}</strong> will be removed from this listing. This cannot be undone.</p>
      </Modal>
    </>
  );
}
