import {
  FiBookOpen,
  FiClipboard,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiMessageSquare,
  FiPackage,
  FiSettings,
  FiShoppingBag,
  FiTrendingDown,
  FiUsers,
} from 'react-icons/fi';
import { PERMISSIONS, ROLES } from '../../utils/roles';

const commonOverview = {
  label: 'Overview',
  path: '/dashboard/overview',
  icon: FiGrid,
  permission: PERMISSIONS.BOOKS_READ,
};

export const sidebarConfig = {
  [ROLES.ADMIN]: [
    commonOverview,
    {
      label: 'All Users',
      path: '/dashboard/all-users',
      icon: FiUsers,
      permission: PERMISSIONS.MANAGE_USERS,
      children: [
        {
          label: 'Authors',
          path: '/dashboard/all-users/authors',
          icon: FiUsers,
          permission: PERMISSIONS.MANAGE_USERS,
        },
        {
          label: 'Users',
          path: '/dashboard/all-users/users',
          icon: FiUsers,
          permission: PERMISSIONS.MANAGE_USERS,
        },
        {
          label: 'Shop',
          path: '/dashboard/all-users/shops',
          icon: FiShoppingBag,
          permission: PERMISSIONS.MANAGE_USERS,
        },
        {
          label: 'Roles',
          path: '/dashboard/all-users/roles',
          icon: FiSettings,
          permission: PERMISSIONS.MANAGE_ROLES,
        },
      ],
    },
    {
      label: 'Total Cost',
      path: '/dashboard/total-cost',
      icon: FiTrendingDown,
      permission: PERMISSIONS.MANAGE_USERS,
    },
    {
      label: 'All Books',
      path: '/dashboard/books',
      icon: FiBookOpen,
      permission: PERMISSIONS.BOOKS_READ,
    },
    {
      label: 'Review Moderation',
      path: '/dashboard/review-moderation',
      icon: FiFileText,
      permission: PERMISSIONS.REVIEW_MODERATE,
    },
    {
      label: 'Magazine',
      path: '/dashboard/magazine',
      icon: FiFileText,
      permission: PERMISSIONS.MAGAZINES_READ,
    },
    {
      label: 'Counter Sales',
      path: '/dashboard/counter-orders',
      icon: FiShoppingBag,
      permission: PERMISSIONS.ORDERS_MANAGE,
    },
    {
      label: 'Online Orders',
      path: '/dashboard/orders',
      icon: FiPackage,
      permission: PERMISSIONS.ORDERS_MANAGE,
    },
    {
      label: 'Stock Inventory',
      path: '/dashboard/stock',
      icon: FiPackage,
      permission: PERMISSIONS.STOCK_MANAGE,
    },
    {
      label: 'Manuscripts',
      path: '/dashboard/manuscripts',
      icon: FiClipboard,
      permission: PERMISSIONS.MANUSCRIPTS_REVIEW,
    },
    {
      label: 'Messages',
      path: '/dashboard/messages',
      icon: FiMessageSquare,
      permission: PERMISSIONS.SUPPORT_READ,
    },
    {
      label: 'Reports',
      path: '/dashboard/reports',
      icon: FiFileText,
      permission: PERMISSIONS.REPORTS_READ,
    },
    {
      label: 'Settings',
      path: '/dashboard/settings',
      icon: FiSettings,
      permission: PERMISSIONS.SETTINGS_MANAGE,
    },
  ],
  [ROLES.MODERATOR]: [
    commonOverview,
    {
      label: 'Review Queue',
      path: '/dashboard/book-review',
      icon: FiBookOpen,
      permission: PERMISSIONS.BOOKS_UPDATE,
    },
    {
      label: 'Review Moderation',
      path: '/dashboard/review-moderation',
      icon: FiFileText,
      permission: PERMISSIONS.REVIEW_MODERATE,
    },
    {
      label: 'Manuscripts',
      path: '/dashboard/manuscripts',
      icon: FiClipboard,
      permission: PERMISSIONS.MANUSCRIPTS_REVIEW,
    },
    {
      label: 'Magazine Reviews',
      path: '/dashboard/magazine-review',
      icon: FiFileText,
      permission: PERMISSIONS.MAGAZINES_UPDATE,
    },
    {
      label: 'Message Moderation',
      path: '/dashboard/message-moderation',
      icon: FiMessageSquare,
      permission: PERMISSIONS.MESSAGES_MODERATE,
    },
    {
      label: 'Authors',
      path: '/dashboard/authors',
      icon: FiUsers,
      permission: PERMISSIONS.AUTHORS_READ,
    },
  ],
  [ROLES.AUTHOR]: [
    commonOverview,
    {
      label: 'My Books',
      path: '/dashboard/my-books',
      icon: FiBookOpen,
      permission: PERMISSIONS.OWN_BOOKS_MANAGE,
    },
    {
      label: 'Book Reviews',
      path: '/dashboard/book-reviews',
      icon: FiFileText,
      permission: PERMISSIONS.REVIEW_VIEW_OWN_BOOKS,
    },
    {
      label: 'Publishing Terms',
      path: '/dashboard/publishing-terms',
      icon: FiFileText,
      permission: PERMISSIONS.OWN_BOOKS_MANAGE,
    },
    {
      label: 'Submit Manuscript',
      path: '/dashboard/manuscripts/new',
      icon: FiClipboard,
      permission: PERMISSIONS.MANUSCRIPTS_SUBMIT,
    },
    {
      label: 'My Profile',
      path: '/dashboard/profile',
      icon: FiUsers,
      permission: PERMISSIONS.OWN_PROFILE_MANAGE,
    },
    {
      label: 'Sales Analytics',
      path: '/dashboard/sales',
      icon: FiFileText,
      permission: PERMISSIONS.OWN_SALES_READ,
    },
  ],
  [ROLES.EMPLOYEE]: [
    commonOverview,
    {
      label: 'Counter Sales',
      path: '/dashboard/counter-orders',
      icon: FiShoppingBag,
      permission: PERMISSIONS.ORDERS_MANAGE,
    },
    {
      label: 'Online Orders',
      path: '/dashboard/orders',
      icon: FiPackage,
      permission: PERMISSIONS.ORDERS_MANAGE,
    },
    {
      label: 'Stock Management',
      path: '/dashboard/stock',
      icon: FiClipboard,
      permission: PERMISSIONS.STOCK_MANAGE,
    },
    {
      label: 'Book Catalog',
      path: '/dashboard/books',
      icon: FiBookOpen,
      permission: PERMISSIONS.BOOKS_READ,
    },
  ],
  [ROLES.USER]: [
    commonOverview,
    {
      label: 'My Orders',
      path: '/dashboard/my-orders',
      icon: FiShoppingBag,
      permission: PERMISSIONS.OWN_ORDERS_READ,
    },
    {
      label: 'Wishlist',
      path: '/dashboard/wishlist',
      icon: FiBookOpen,
      permission: PERMISSIONS.WISHLIST_USE,
    },
    {
      label: 'Addresses',
      path: '/dashboard/addresses',
      icon: FiUsers,
      permission: PERMISSIONS.OWN_ADDRESSES_MANAGE,
    },
    {
      label: 'Add Magazine',
      path: '/dashboard/magazines/new',
      icon: FiFileText,
      permission: PERMISSIONS.MAGAZINES_CREATE,
    },
    {
      label: 'My Reviews',
      path: '/dashboard/my-reviews',
      icon: FiFileText,
      permission: PERMISSIONS.REVIEW_WRITE,
    },
    {
      label: 'Profile',
      path: '/dashboard/user-profile',
      icon: FiUsers,
      permission: PERMISSIONS.OWN_PROFILE_MANAGE,
    },
    {
      label: 'Become an Author',
      path: '/dashboard/become-author',
      icon: FiFileText,
      permission: PERMISSIONS.AUTHOR_APPLICATION_SUBMIT,
    },
  ],
};

export default sidebarConfig;
