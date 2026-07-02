'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !email.trim() || !phone.trim() || !comments.trim()) {
      setError('Please complete all fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          comments,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || 'Failed to send message.');
        return;
      }

      setSuccess('Thank you! Your message has been sent.');
      setName('');
      setEmail('');
      setPhone('');
      setComments('');
    } catch (submitError) {
      console.error('Error submitting contact form:', submitError);
      setError('Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Contact Us</h1>
          <p className="mt-3 text-slate-600">
            Have a question about one of our properties? Send us a message and we&apos;ll get back to you.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="contact-comments" className="block text-sm font-medium text-slate-700 mb-1">
                Comments
              </label>
              <textarea
                id="contact-comments"
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                rows={6}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-green-700 text-sm">
                {success}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="px-8 font-semibold">
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
