import { useEffect, useState } from 'react';
import { faqItems } from '../../data/pageData';

const API_BASE_URL = 'http://localhost:8000/api';
const VND_TO_USD = 25500;

const PAYMENT_METHODS = ['sepay', 'vnpay', 'paypal'];

function formatUsdFromVnd(value) {
  const vnd = Number(value || 0);
  const usd = vnd / VND_TO_USD;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
}

function getDurationLabel(days) {
  const totalDays = Number(days || 0);

  if (totalDays === 30) return '30 days access';
  if (totalDays === 90) return '90 days access';
  if (totalDays === 365) return '365 days access';
  return `${totalDays} days access`;
}

function getPlanBadge(planName, index) {
  const normalized = String(planName || '').toLowerCase();

  if (normalized.includes('pro')) return 'Most Popular';
  if (index === 0) return 'Starter';
  return 'Plan';
}

export default function PlansPage({ auth, onRequireLogin }) {
  const [faqOpen, setFaqOpen] = useState(0);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingKey, setPayingKey] = useState(null);
  const [payError, setPayError] = useState('');

  const requiresLogin = auth?.role === 'visitor';

  useEffect(() => {
    let cancelled = false;

    async function fetchPlans() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${API_BASE_URL}/subscription-plans`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'Failed to fetch subscription plans');
        }

        if (!cancelled) {
          setPlans(Array.isArray(result.data) ? result.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load subscription plans');
          setPlans([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  function getAuthHeaders() {
    return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
  }

  async function handlePay(plan, method) {
    const payingKeyValue = `${plan.id}-${method}`;

    try {
      setPayError('');
      setPayingKey(payingKeyValue);

      // Bước 1: tạo subscription (pending) cho plan này
      const subscriptionResponse = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          planId: plan.id,
          autoRenew: false,
        }),
      });

      const subscriptionResult = await subscriptionResponse.json();

      if (!subscriptionResponse.ok || subscriptionResult.success === false) {
        throw new Error(subscriptionResult.message || 'Failed to create subscription');
      }

      const subscriptionId = subscriptionResult.data?.id;

      if (!subscriptionId) {
        throw new Error('Subscription created but no id returned');
      }

      // Bước 2: tạo payment với subscription_id vừa tạo
      const paymentResponse = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          payment_method: method,
        }),
      });

      const paymentResult = await paymentResponse.json();

      if (!paymentResponse.ok || paymentResult.success === false) {
        throw new Error(paymentResult.message || 'Failed to create payment');
      }

      const paymentUrl =
        paymentResult.data?.payment_url || paymentResult.data?.paymentUrl || paymentResult.data?.url;

      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    } catch (err) {
      setPayError(err.message || 'Failed to create payment');
    } finally {
      setPayingKey(null);
    }
  }

  return (
    <>
      {loading && <div className="card">Loading subscription plans...</div>}

      {error && !loading && (
        <div className="card" style={{ color: 'crimson' }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="card">
            <div className="section-title">
              <div>
                <h2>Available plans</h2>
                <p className="text-muted">
                  Choose the subscription that fits your reading needs.
                </p>
              </div>
              <span className="badge secondary">
                {plans.length} active plan{plans.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {payError && (
            <div className="card" style={{ color: 'crimson' }}>
              {payError}
            </div>
          )}

          <div className="pricing-grid">
            {plans.map((plan, index) => {
              const isHighlighted = String(plan.name || '').toLowerCase().includes('pro');

              return (
                <div
                  key={plan.id}
                  className={`plan-card card ${isHighlighted ? 'pro' : 'free'}`}
                >
                  <span className={`plan-label ${isHighlighted ? 'plan-badge' : ''}`}>
                    {getPlanBadge(plan.name, index)}
                  </span>

                  <h3 style={{ marginBottom: 8 }}>{plan.name}</h3>
                  <h3 className="plan-cost">{formatUsdFromVnd(plan.price)}</h3>
                  <p className="plan-period small-text">{getDurationLabel(plan.duration_days)}</p>

                  <div className="plan-list">
                    {Array.isArray(plan.features) && plan.features.length > 0 ? (
                      plan.features.map((feature, featureIndex) => (
                        <div key={`${plan.id}-${featureIndex}`} className="plan-feature">
                          <span>✓</span> {feature}
                        </div>
                      ))
                    ) : (
                      <div className="plan-feature">
                        <span>✓</span> Plan benefits will be updated soon
                      </div>
                    )}
                  </div>

                  <div className="plan-payment-list">
                    {requiresLogin ? (
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={onRequireLogin}
                      >
                        Login to Subscribe
                      </button>
                    ) : (
                      PAYMENT_METHODS.map((method) => {
                        const keyValue = `${plan.id}-${method}`;
                        const isPaying = payingKey === keyValue;

                        return (
                          <button
                            key={keyValue}
                            className="btn btn-payment"
                            type="button"
                            disabled={isPaying}
                            onClick={() => handlePay(plan, method)}
                          >
                            {isPaying ? 'Processing...' : `Pay with ${method}`}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {plans.length === 0 && (
            <div className="card">No subscription plans available right now.</div>
          )}

          <div className="faq-list">
            {faqItems.map((item, index) => (
              <div key={item.question} className="faq-item">
                <button type="button" onClick={() => setFaqOpen(index)}>
                  <span>{item.question}</span>
                  <span>{faqOpen === index ? '-' : '+'}</span>
                </button>
                {faqOpen === index && <div className="answer">{item.answer}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}