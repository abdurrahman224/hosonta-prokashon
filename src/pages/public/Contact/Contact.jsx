import { useState } from 'react';
import {
  FiFacebook,
  FiGlobe,
  FiInstagram,
  FiMail,
  FiMapPin,
  FiSend,
  FiYoutube,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';

// TODO: নিচের লিংকগুলো আপনার আসল লিংক দিয়ে বদলে নিন
const LINKS = {
  whatsapp: 'https://wa.me/8801628037591',
  facebook: 'https://www.facebook.com/hosontoprokashoni/?locale=bn_IN',
  instagram: 'https://www.instagram.com/',
  youtube: 'https://www.youtube.com/',
  hikma: 'https://hikmabd.com/',
  email: 'mailto:hasanta.pro@gmail.com',
};

const initialForm = { name: '', email: '', subject: '', message: '' };

function Contact() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'আপনার নাম লিখুন।';
    if (!form.email.trim()) {
      nextErrors.email = 'আপনার ইমেইল লিখুন।';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'সঠিক ইমেইল ঠিকানা লিখুন।';
    }
    if (!form.subject.trim()) nextErrors.subject = 'বিষয় লিখুন।';
    if (!form.message.trim()) nextErrors.message = 'আপনার বার্তা লিখুন।';
    return nextErrors;
  };

  const handleSubmit = event => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    toast.success('আপনার বার্তা সফলভাবে পাঠানো হয়েছে।');
    setForm(initialForm);
    setErrors({});
  };

  return (
    <div className="bg-cream">
      {/* Header */}
      <section className="bg-dark px-4 py-6 text-white md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">
          <p className="font-heading text-xs font-semibold tracking-wide text-primary">
            হসন্ত প্রকাশনী
          </p>
          <h1 className="mt-1.5 font-heading text-sm font-bold md:text-base">
            যোগাযোগ করুন
          </h1>
          <p className="mt-2 max-w-xl text-xs text-white/65 md:text-base">
            আপনার প্রশ্ন, মতামত বা পাণ্ডুলিপি নিয়ে আমাদের লিখুন।
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-8 md:py-10 lg:grid-cols-[1.25fr_1fr]">
        {/* Form */}
        <section className="rounded-lg border border-dark/10 bg-white p-3.5 md:p-4">
          <h2 className="font-heading text-base font-bold text-dark md:text-xl">
            বার্তা পাঠান
          </h2>
          <p className="mt-1 text-xs md:text-sm ">
            ফর্মটি পূরণ করুন, আমরা শীঘ্রই যোগাযোগ করব।
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-2.5">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <FormField
                label="আপনার নাম"
                name="name"
                value={form.name}
                error={errors.name}
                onChange={handleChange}
                placeholder="নাম লিখুন"
              />
              <FormField
                label="ইমেইল"
                name="email"
                type="email"
                value={form.email}
                error={errors.email}
                onChange={handleChange}
                placeholder="example@email.com"
              />
            </div>
            <FormField
              label="বিষয়"
              name="subject"
              value={form.subject}
              error={errors.subject}
              onChange={handleChange}
              placeholder="কী বিষয়ে লিখছেন?"
            />
            <FormField
              label="বার্তা"
              name="message"
              value={form.message}
              error={errors.message}
              onChange={handleChange}
              placeholder="আপনার বার্তা লিখুন..."
              textarea
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-dark px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-dark-gray focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FiSend className="text-base" /> বার্তা পাঠান
            </button>
          </form>
        </section>

        {/* Contact info */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-dark/10 bg-white p-3.5 md:p-4">
            <h2 className="font-heading text-base font-bold text-dark md:text-xl">
              যোগাযোগের তথ্য
            </h2>

            <ul className="mt-4 divide-y divide-dark/10">
              <InfoRow
                icon={<FaWhatsapp />}
                text="01628-037591"
                href={LINKS.whatsapp}
              />
              <InfoRow
                icon={<FiMail />}
                text="hasanta.pro@gmail.com"
                href={LINKS.email}
              />
              <InfoRow
                icon={<FiMapPin />}
                text="৩৮/২ মান্নান বাজার (২য় তলা), বাংলাবাজার, ঢাকা-১১০০"
              />
            </ul>

            <div className="mt-4 flex items-center gap-2.5 border-t border-dark/10 pt-4">
              <SocialLink
                href={LINKS.facebook}
                icon={<FiFacebook />}
                label="ফেসবুক"
              />
              <SocialLink
                href={LINKS.instagram}
                icon={<FiInstagram />}
                label="ইনস্টাগ্রাম"
              />
              <SocialLink
                href={LINKS.youtube}
                icon={<FiYoutube />}
                label="ইউটিউব"
              />
              <SocialLink
                href={LINKS.hikma}
                icon={<FiGlobe />}
                label="হিকমা বিডি"
              />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function InfoRow({ icon, text, href }) {
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-lg text-dark">
        {icon}
      </span>
      <p className="min-w-0 break-words text-sm font-medium text-dark">
        {text}
      </p>
    </>
  );

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 transition hover:opacity-80"
        >
          {content}
        </a>
      ) : (
        <div className="flex items-center gap-3">{content}</div>
      )}
    </li>
  );
}

function SocialLink({ href, icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-dark/10 bg-cream text-lg text-dark transition hover:border-primary hover:bg-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {icon}
    </a>
  );
}

function FormField({
  label,
  name,
  value,
  error,
  onChange,
  placeholder,
  type = 'text',
  textarea = false,
}) {
  const Component = textarea ? 'textarea' : 'input';

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-dark">
        {label}
      </span>
      <Component
        type={textarea ? undefined : type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={textarea ? 4 : undefined}
        className={`w-full rounded-md border bg-cream px-3 py-2 text-sm text-dark outline-none transition focus:outline-none focus:ring-0 ${
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-dark/10 focus:border-primary'
        }`}
      />
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

export default Contact;
