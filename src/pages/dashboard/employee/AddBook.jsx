import { useState, useMemo, useRef, useEffect } from 'react';
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiFileText,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiUploadCloud,
  FiCheck,
  FiAlertCircle,
  FiImage,
} from 'react-icons/fi';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useData } from '../../../context/useData';

const DEFAULT_CATEGORIES = [
  'Novel',
  'Poetry',
  'Islamic Books',
  'Self-Development & Marriage',
  'Literature',
  'History & Research',
  'Philosophy & Thought',
  'Thriller & Mystery',
  'Short Stories',
  'Science Fiction',
  'Children & Young Adult',
  'Essays & Articles',
];

const DEFAULT_PUBLISHERS = ['হসন্ত প্রকাশন', 'সেরা পাবলিকেশন', 'Hosonta Prokashon'];

export default function AddBook() {
  const { addBook, updateBook, books = [], publishers = [] } = useData();
  const navigate = useNavigate();
  const { id: editBookId } = useParams();
  const [searchParams] = useSearchParams();
  const urlPublisher = searchParams.get('publisher');

  const isEditMode = Boolean(editBookId);
  const existingBook = useMemo(() => {
    if (!editBookId) return null;
    return books.find((b) => String(b.id) === String(editBookId)) || null;
  }, [books, editBookId]);

  const categoryOptions = useMemo(() => {
    const set = new Set([...DEFAULT_CATEGORIES, ...books.map(b => b.category).filter(Boolean)]);
    if (existingBook?.category) set.add(existingBook.category);
    return Array.from(set);
  }, [books, existingBook]);

  const publisherOptions = useMemo(() => {
    const fromContext = (publishers || []).map(p => p.name);
    const set = new Set([...fromContext, ...DEFAULT_PUBLISHERS, ...books.map(b => b.publisher).filter(Boolean)]);
    if (existingBook?.publisher) set.add(existingBook.publisher);
    if (urlPublisher) set.add(urlPublisher);
    return Array.from(set);
  }, [publishers, books, existingBook, urlPublisher]);

  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Form state matching Image 1: Products Description
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Novel');
  const [customCategory, setCustomCategory] = useState('');
  const [publisher, setPublisher] = useState(urlPublisher || 'হসন্ত প্রকাশন');
  const [customPublisher, setCustomPublisher] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [totalPages, setTotalPages] = useState('150');
  const [coverType, setCoverType] = useState('Paperback');
  const [publishingYear, setPublishingYear] = useState('2026');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (urlPublisher && !isEditMode) {
      setPublisher(urlPublisher);
    }
  }, [urlPublisher, isEditMode]);

  // Form state matching Image 2: Pricing & Availability
  const [price, setPrice] = useState('350.00');
  const [discount, setDiscount] = useState('0');
  const [stockQuantity, setStockQuantity] = useState(25);
  const [availabilityStatus, setAvailabilityStatus] = useState('In Stock');

  // Form state matching Image 3: Products Images, Sample PDF & Schedule Post
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [samplePdfFile, setSamplePdfFile] = useState(null);
  const [samplePdfUrl, setSamplePdfUrl] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [publishDate, setPublishDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [publishTime, setPublishTime] = useState('10:00');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Pre-fill existing book data in edit mode
  useEffect(() => {
    if (existingBook) {
      setProductName(existingBook.title || '');
      setCategory(existingBook.category || 'Novel');
      setPublisher(existingBook.publisher || 'Hosonta Prokashon');
      setAuthorName(existingBook.author || '');
      setTotalPages(String(existingBook.pages || '150'));
      setCoverType(existingBook.coverType || 'Paperback');
      setPublishingYear(String(existingBook.publishedYear || '2026'));
      setDescription(existingBook.description || '');

      const regularPrice =
        existingBook.price ?? existingBook.regularPrice ?? existingBook.retailPrice ?? '350.00';
      setPrice(String(regularPrice));

      const disc = existingBook.discount ?? existingBook.offer ?? '0';
      setDiscount(String(disc));

      setStockQuantity(Number(existingBook.stock ?? 25));
      setAvailabilityStatus(existingBook.availability || 'In Stock');

      setImagePreview(existingBook.cover || existingBook.image || '');
      setImageUrl(existingBook.cover || existingBook.image || '');
      setSamplePdfUrl(existingBook.samplePdfUrl || '');

      if (existingBook.isScheduled && existingBook.scheduledAt) {
        setIsScheduled(true);
        setPublishDate(existingBook.scheduledAt.slice(0, 10));
        setPublishTime(existingBook.scheduledAt.slice(11, 16));
      }
    }
  }, [existingBook]);

  // Auto-calculated Selling Price matching Image 2
  const sellingPrice = useMemo(() => {
    const p = parseFloat(price) || 0;
    const d = parseFloat(discount) || 0;
    if (p <= 0) return '0.00';
    const finalPrice = Math.max(0, p * (1 - d / 100));
    return finalPrice.toFixed(2);
  }, [price, discount]);

  // Handle Cover Image Upload
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (PNG, JPG, SVG, WebP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Sample PDF Upload
  const handlePdfFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error('PDF file size must be less than 25MB');
        return;
      }
      setSamplePdfFile(file);
      toast.success(`PDF selected: ${file.name}`);
    }
  };

  // Stepper handlers matching Image 2
  const handleDecrementStock = () => {
    setStockQuantity((prev) => Math.max(0, Number(prev || 0) - 1));
  };

  const handleIncrementStock = () => {
    setStockQuantity((prev) => Number(prev || 0) + 1);
  };

  // Validation
  const validateForm = () => {
    const errs = {};
    if (!productName.trim()) {
      errs.productName = 'Product name is required';
    }
    if (!authorName.trim()) {
      errs.authorName = 'Author name is required';
    }
    if (!price || parseFloat(price) <= 0) {
      errs.price = 'Please enter a valid price';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler: Draft or Publish/Schedule
  const handleSave = async (targetStatus) => {
    if (targetStatus !== 'draft' && !validateForm()) {
      toast.error('Please fill in the required fields highlighted in red');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedCategory =
        category === 'Other' && customCategory.trim()
          ? customCategory.trim()
          : category;

      const selectedPublisher =
        publisher === 'Other Publisher' && customPublisher.trim()
          ? customPublisher.trim()
          : publisher;

      const coverImg =
        imagePreview ||
        imageUrl.trim() ||
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=80';

      const finalStatus =
        targetStatus === 'draft'
          ? 'draft'
          : isScheduled
          ? 'scheduled'
          : 'published';

      const payload = {
        title: productName.trim() || 'Untitled Book',
        author: authorName.trim() || 'Unknown Author',
        publisher: selectedPublisher,
        category: selectedCategory,
        pages: parseInt(totalPages, 10) || 0,
        coverType,
        publishedYear: parseInt(publishingYear, 10) || new Date().getFullYear(),
        description: description.trim(),
        price: parseFloat(price) || 0,
        regularPrice: parseFloat(price) || 0,
        discount: parseFloat(discount) || 0,
        offer: parseFloat(discount) || 0,
        salePrice: parseFloat(sellingPrice) || 0,
        offerPrice: parseFloat(sellingPrice) || 0,
        stock: parseInt(stockQuantity, 10) || 0,
        availability: availabilityStatus,
        status: finalStatus,
        isScheduled: Boolean(isScheduled),
        scheduledAt: isScheduled ? `${publishDate}T${publishTime}:00` : null,
        cover: coverImg,
        image: coverImg,
        samplePdfName: samplePdfFile?.name || (samplePdfUrl ? 'sample-preview.pdf' : null),
        samplePdfUrl: samplePdfUrl.trim() || null,
        isNew: true,
        featured: false,
      };

      if (isEditMode) {
        if (typeof updateBook === 'function') {
          updateBook(editBookId, payload);
        }
        toast.success(`Book "${payload.title}" updated successfully!`);
      } else {
        if (typeof addBook === 'function') {
          addBook(payload);
        }

        if (finalStatus === 'scheduled') {
          toast.success(`Book scheduled for publication on ${publishDate} at ${publishTime}!`);
        } else if (finalStatus === 'draft') {
          toast.success('Book saved as draft successfully!');
        } else {
          toast.success('Book published to catalog successfully!');
        }
      }

      navigate('/dashboard/books');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16 font-sans">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/dashboard/books"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-dark/60 transition hover:text-dark"
          >
            <FiArrowLeft size={14} /> Back to Catalog
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-dark sm:text-3xl mt-1">
            {isEditMode ? `Edit Book: ${existingBook?.title || ''}` : 'Add New Book'}
          </h1>
          <p className="text-xs text-dark/60">
            {isEditMode
              ? 'Update book specifications, pricing, stock, or cover media'
              : 'Create and publish a new book in Hosonta Prokashon collection'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave('draft')}
            className="rounded-xl border border-dark/20 bg-white px-5 py-2.5 text-xs font-bold text-dark shadow-2xs transition hover:bg-cream disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave('publish')}
            className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-dark shadow-xs transition hover:bg-primary-hover disabled:opacity-50"
          >
            {isEditMode
              ? 'Update Book'
              : isScheduled
              ? 'Schedule Book'
              : 'Publish Product'}
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* CARD 1: Products Description (Matching Image 1)                     */}
      {/* =================================================================== */}
      <div className="rounded-2xl border border-dark/10 bg-white p-6 shadow-xs sm:p-8">
        <h2 className="font-heading text-lg font-bold text-dark sm:text-xl mb-6">
          Products Description
        </h2>

        <div className="space-y-5">
          {/* Row 1: Product Name & Category */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-dark/80 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter product name"
                value={productName}
                onChange={e => {
                  setProductName(e.target.value);
                  if (errors.productName)
                    setErrors({ ...errors, productName: null });
                }}
                className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-dark placeholder:text-dark/40 focus:outline-none transition ${
                  errors.productName
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-dark/15 focus:border-primary'
                }`}
              />
              {errors.productName && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.productName}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/80 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="h-11 w-full rounded-xl border border-dark/15 bg-white px-4 text-sm text-dark focus:border-primary focus:outline-none transition"
              >
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Other">Other Category...</option>
              </select>
              {category === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="mt-2 h-10 w-full rounded-xl border border-dark/15 bg-white px-4 text-sm text-dark focus:border-primary focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Row 2: Publisher (Brand replacement) & Author Name (Color replacement) */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-dark/80 mb-2">
                Publisher
              </label>
              <select
                value={publisher}
                onChange={e => setPublisher(e.target.value)}
                className="h-11 w-full rounded-xl border border-dark/15 bg-white px-4 text-sm text-dark focus:border-primary focus:outline-none transition"
              >
                {publisherOptions.map(pub => (
                  <option key={pub} value={pub}>
                    {pub}
                  </option>
                ))}
                <option value="Other Publisher">Other Publisher...</option>
              </select>
              {publisher === 'Other Publisher' && (
                <input
                  type="text"
                  placeholder="Enter publisher name"
                  value={customPublisher}
                  onChange={e => setCustomPublisher(e.target.value)}
                  className="mt-2 h-10 w-full rounded-xl border border-dark/15 bg-white px-4 text-sm text-dark focus:border-primary focus:outline-none"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/80 mb-2">
                Author Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter author name"
                value={authorName}
                onChange={e => {
                  setAuthorName(e.target.value);
                  if (errors.authorName)
                    setErrors({ ...errors, authorName: null });
                }}
                className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-dark placeholder:text-dark/40 focus:outline-none transition ${
                  errors.authorName
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-dark/15 focus:border-primary'
                }`}
              />
              {errors.authorName && (
                <span className="mt-1 block text-xs text-red-500">
                  {errors.authorName}
                </span>
              )}
            </div>
          </div>

          {/* Row 3: Total Pages (Weight kg replacement), Cover Type (Length cm replacement), Publishing Year (Width cm replacement) */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-dark/80 mb-2">
                Total Pages
              </label>
              <input
                type="number"
                min="1"
                placeholder="150"
                value={totalPages}
                onChange={e => setTotalPages(e.target.value)}
                className="h-11 w-full rounded-xl border border-dark/15 bg-white px-4 text-sm text-dark placeholder:text-dark/40 focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/80 mb-2">
                Cover Type
              </label>
              <select
                value={coverType}
                onChange={e => setCoverType(e.target.value)}
                className="h-11 w-full rounded-xl border border-dark/15 bg-white px-4 text-sm text-dark focus:border-primary focus:outline-none transition"
              >
                <option value="Paperback">পেপারব্যাক </option>
                <option value="Hardcover">হার্ডকভার </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/80 mb-2">
                Publishing Year
              </label>
              <input
                type="number"
                min="1950"
                max="2035"
                placeholder="2026"
                value={publishingYear}
                onChange={e => setPublishingYear(e.target.value)}
                className="h-11 w-full rounded-xl border border-dark/15 bg-white px-4 text-sm text-dark placeholder:text-dark/40 focus:border-primary focus:outline-none transition"
              />
            </div>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block text-xs font-semibold text-dark/80 mb-2">
              Description
            </label>
            <textarea
              rows={5}
              placeholder="Enter your description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-xl border border-dark/15 bg-white p-4 text-sm text-dark placeholder:text-dark/40 focus:border-primary focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* CARD 2: Pricing & Availability (Matching Image 2)                   */}
      {/* =================================================================== */}
      <div className="rounded-2xl border border-dark/10 bg-white p-6 shadow-xs sm:p-8">
        <h2 className="font-heading text-lg font-bold text-dark sm:text-xl mb-6">
          Pricing & Availability
        </h2>

        <div className="space-y-5">
          {/* Row 1: Price, Discount, Selling Price */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-dark/80 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="h-11 w-full rounded-xl border border-dark/15 bg-white px-4 text-sm text-dark placeholder:text-dark/40 focus:border-primary focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/80 mb-2">
                Discount
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0%"
                  value={discount ? `${discount}%` : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/%/g, '').trim();
                    setDiscount(raw);
                  }}
                  className="h-11 w-full rounded-xl border border-dark/15 bg-white px-4 text-sm text-dark placeholder:text-dark/40 focus:border-primary focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/80 mb-2">
                Selling Price
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  placeholder="0.00"
                  value={sellingPrice}
                  className="h-11 w-full rounded-xl border border-dark/10 bg-cream/50 px-4 text-sm font-semibold text-dark focus:outline-none cursor-default"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Stock Quantity (Stepper matching Image 2) & Availability Status */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-dark/80 mb-2">
                Stock Quantity
              </label>
              <div className="flex h-11 w-full items-center justify-between rounded-xl border border-dark/15 bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={handleDecrementStock}
                  className="flex h-full w-12 items-center justify-center text-dark/70 hover:bg-cream transition border-r border-dark/10"
                  aria-label="Decrease quantity"
                >
                  <FiMinus size={15} />
                </button>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={e =>
                    setStockQuantity(
                      Math.max(0, parseInt(e.target.value, 10) || 0),
                    )
                  }
                  className="h-full w-full text-center text-sm font-semibold text-dark focus:outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={handleIncrementStock}
                  className="flex h-full w-12 items-center justify-center text-dark/70 hover:bg-cream transition border-l border-dark/10"
                  aria-label="Increase quantity"
                >
                  <FiPlus size={15} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/80 mb-2">
                Availability Status
              </label>
              <select
                value={availabilityStatus}
                onChange={e => setAvailabilityStatus(e.target.value)}
                className="h-11 w-full rounded-xl border border-dark/15 bg-white px-4 text-sm text-dark focus:border-primary focus:outline-none transition"
              >
                <option value="In Stock">In Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Pre-Order">Pre-Order</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* CARD 3: Products Images, Sample PDF & Schedule Post (Matching Image 3)*/}
      {/* =================================================================== */}
      <div className="rounded-2xl border border-dark/10 bg-white p-6 shadow-xs sm:p-8">
        <h2 className="font-heading text-lg font-bold text-dark sm:text-xl mb-6">
          Products Images
        </h2>

        {/* Section 1: Book Cover Upload Area matching Image 3 */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileChange}
            accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/gif, image/webp"
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dark/20 bg-cream/20 p-8 sm:p-12 text-center transition cursor-pointer hover:border-primary hover:bg-cream/50"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-2xs border border-dark/10 text-dark/70 mb-3">
                <FiUploadCloud size={24} />
              </div>
              <p className="text-sm font-semibold text-dark">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-dark/50 mt-1">
                SVG, PNG, JPG or GIF (MAX. 800x400px)
              </p>
            </div>
          ) : (
            <div className="relative rounded-2xl border border-dark/15 p-4 bg-cream/20 flex flex-col sm:flex-row items-center gap-5">
              <img
                src={imagePreview}
                alt="Book cover preview"
                className="h-44 w-32 rounded-xl object-cover shadow-sm border border-dark/10 shrink-0"
              />
              <div className="space-y-2 text-center sm:text-left flex-1">
                <h4 className="font-heading text-base font-bold text-dark">
                  Cover Image Selected
                </h4>
                <p className="text-xs text-dark/60">
                  Image ready for publication. You can replace or remove it.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-dark/20 bg-white px-3.5 py-1.5 text-xs font-semibold text-dark hover:bg-cream transition shadow-2xs"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setImagePreview('')}
                    className="rounded-lg bg-red-50 text-red-600 px-3.5 py-1.5 text-xs font-semibold hover:bg-red-100 transition inline-flex items-center gap-1"
                  >
                    <FiTrash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Image URL fallback */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-dark/50 whitespace-nowrap">
              Or Image URL:
            </span>
            <input
              type="url"
              placeholder="https://example.com/cover.jpg"
              value={imageUrl}
              onChange={e => {
                setImageUrl(e.target.value);
                if (e.target.value) setImagePreview(e.target.value);
              }}
              className="h-9 w-full rounded-xl border border-dark/15 bg-white px-3 text-xs text-dark focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Sample PDF (Short Preview) */}
        <div className="mt-8 border-t border-dark/10 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-heading text-base font-bold text-dark flex items-center gap-2">
                <FiFileText className="text-primary text-lg" /> Sample PDF
                (Short Preview)
              </h3>
              <p className="text-xs text-dark/60">
                Upload a preview sample PDF for readers (e.g. Table of Contents,
                First Chapter)
              </p>
            </div>
          </div>

          <input
            type="file"
            ref={pdfInputRef}
            onChange={handlePdfFileChange}
            accept="application/pdf"
            className="hidden"
          />

          {!samplePdfFile ? (
            <div
              onClick={() => pdfInputRef.current?.click()}
              className="flex items-center justify-between rounded-xl border border-dashed border-dark/20 bg-cream/20 p-4 transition cursor-pointer hover:border-primary hover:bg-cream/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-dark/10 text-dark/60 shadow-2xs">
                  <FiFileText size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-dark">
                    Upload Short PDF Sample
                  </p>
                  <p className="text-[11px] text-dark/50">
                    PDF files only, maximum 25MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="rounded-lg bg-white border border-dark/15 px-3 py-1.5 text-xs font-semibold text-dark shadow-2xs hover:bg-cream"
              >
                Browse PDF
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-dark/15 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <FiFileText size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-dark truncate max-w-xs sm:max-w-md">
                    {samplePdfFile.name}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    {(samplePdfFile.size / (1024 * 1024)).toFixed(2)} MB • PDF
                    ready
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSamplePdfFile(null)}
                className="rounded-lg p-1.5 text-red-500 hover:bg-red-100 transition"
                title="Remove PDF"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          )}

          {/* Sample PDF URL fallback */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-dark/50 whitespace-nowrap">
              Or PDF URL:
            </span>
            <input
              type="url"
              placeholder="https://example.com/sample-chapter.pdf"
              value={samplePdfUrl}
              onChange={e => setSamplePdfUrl(e.target.value)}
              className="h-9 w-full rounded-xl border border-dark/15 bg-white px-3 text-xs text-dark focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Section 3: Schedule Post */}
        <div className="mt-8 border-t border-dark/10 pt-6">
          <div className="rounded-xl border border-dark/15 bg-cream/40 p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-heading text-sm font-bold text-dark block flex items-center gap-2">
                  <FiCalendar className="text-primary" /> Schedule Post
                </span>
                <span className="text-xs text-dark/60">
                  Publish this book automatically at a specified date and time
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={e => setIsScheduled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-dark/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {isScheduled && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-dark/10 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-dark/80 mb-1.5">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={publishDate}
                    onChange={e => setPublishDate(e.target.value)}
                    className="h-10 w-full rounded-xl border border-dark/15 bg-white px-3 text-xs font-semibold text-dark focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark/80 mb-1.5">
                    Publish Time
                  </label>
                  <input
                    type="time"
                    value={publishTime}
                    onChange={e => setPublishTime(e.target.value)}
                    className="h-10 w-full rounded-xl border border-dark/15 bg-white px-3 text-xs font-semibold text-dark focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="col-span-full rounded-lg bg-primary/15 px-3 py-2 text-xs font-medium text-dark">
                  Book will remain hidden until{' '}
                  <strong>
                    {publishDate} at {publishTime}
                  </strong>
                  , then publish automatically.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Bottom Action Buttons matching Image 3 */}
        <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-dark/10">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave('draft')}
            className="rounded-xl border border-dark/20 bg-white px-6 py-2.5 text-sm font-semibold text-dark shadow-2xs transition hover:bg-cream disabled:opacity-50"
          >
            Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave('publish')}
            className="rounded-xl bg-primary px-7 py-2.5 text-sm font-bold text-dark shadow-xs transition hover:bg-primary-hover disabled:opacity-50"
          >
            {isEditMode
              ? 'Update Book'
              : isScheduled
              ? 'Schedule Book'
              : 'Publish Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
