import { useEffect } from 'react';
import {
  FiArrowLeft,
  FiUsers,
} from 'react-icons/fi';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import authors from '../../data/authors';
import books from '../../data/books';
import AuthorProfileContent from './Authors/AuthorProfileContent';
import { findAuthorBySlugOrId, getAuthorPath } from '../../utils/authorSlug';

function AuthorProfile() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const author = findAuthorBySlugOrId(slug, authors);
  const canonicalPath = author ? getAuthorPath(author, authors) : '';

  useEffect(() => {
    if (
      author &&
      slug &&
      String(author.id) === slug &&
      canonicalPath !== `/authors/${slug}`
    ) {
      navigate(`${canonicalPath}${location.hash || ''}`, { replace: true });
    }
  }, [author, slug, canonicalPath, location.hash, navigate]);

  if (!author) return <AuthorNotFound />;

  const authorBooks = books.filter(
    book => book.authorId === author.id && book.status === 'published',
  );

  return <AuthorProfileContent author={author} books={authorBooks} />;
}

function AuthorNotFound() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-cream px-5 py-20 text-center">
      <div>
        <FiUsers className="mx-auto text-5xl text-primary-hover" />
        <h1 className="mt-5 font-heading text-4xl font-bold text-dark">
          লেখক পাওয়া যায়নি
        </h1>
        <p className="mt-3 text-lg text-dark-muted">
          লেখকের লিংকটি সঠিক নয় অথবা প্রোফাইলটি আর উপলব্ধ নেই।
        </p>
        <Link
          to="/authors"
          className="mt-6 inline-flex items-center gap-2 font-semibold text-dark transition hover:text-primary-hover"
        >
          <FiArrowLeft /> লেখকদের তালিকায় ফিরুন
        </Link>
      </div>
    </main>
  );
}

export default AuthorProfile;
