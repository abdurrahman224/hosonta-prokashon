import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useFormat from '../../hooks/useFormat';
import { getAuthorPath } from '../../utils/authorSlug';

function AuthorCard({ author }) {
  const { formatNumber } = useFormat();

  return (
    <motion.article
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="group h-full rounded-xl border border-dark/10 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg"
    >
      <Link
        to={getAuthorPath(author)}
        className="flex h-full flex-col items-center px-3 py-5 text-center sm:px-4 sm:py-6"
      >
        <img
          src={author.photo}
          alt={author.name?.bn || author.name}
          width="96"
          height="96"
          className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
          loading="lazy"
        />
        <h2 className="mt-4 line-clamp-2 font-heading text-sm font-bold leading-snug text-dark transition group-hover:text-primary-hover sm:text-base">
          {author.name?.bn || author.name}
        </h2>
        <p className="mt-auto pt-2 text-xs text-dark-muted sm:text-sm">
          {formatNumber(author.booksCount)}টি বই
        </p>
      </Link>
    </motion.article>
  );
}

export default AuthorCard;
