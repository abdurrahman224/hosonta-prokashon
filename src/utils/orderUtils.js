import books from '../data/books'

export const formatDate = (value, withTime = false) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const options = { month: 'short', day: 'numeric', year: 'numeric' }
  if (withTime) {
    options.hour = 'numeric'
    options.minute = '2-digit'
  }
  return date.toLocaleString('en-US', options)
}

export const formatTime = value => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const resolveItem = item => {
  const book = books.find(entry => String(entry.id) === String(item.bookId))
  return {
    ...item,
    image:
      item.image ||
      item.cover ||
      book?.cover ||
      book?.image ||
      book?.coverImage ||
      '',
    author: item.author || book?.author || '',
    title: item.title || book?.title?.bn || book?.title || '',
    qty: Number(item.quantity ?? item.qty ?? 1),
    price: Number(item.price ?? book?.price ?? 0),
  }
}

export const getAmounts = (order, items) => {
  const subtotal = Number(
    order.subtotal ??
      items.reduce((sum, item) => sum + item.price * item.qty, 0),
  )
  const delivery = Number(
    order.deliveryCharge ??
      order.shippingCharge ??
      order.shippingFee ??
      0,
  )
  const discount = Number(order.discount ?? 0)
  const payable = Number(order.total ?? subtotal + delivery - discount)
  const count = items.reduce((sum, item) => sum + item.qty, 0)
  return { subtotal, delivery, discount, payable, count }
}

export const getShipping = (order, currentUser) => {
  const raw =
    order.shippingAddress ?? order.address ?? order.shipping ?? ''

  if (typeof raw === 'string') {
    return {
      name: order.name ?? order.customerName ?? currentUser?.name ?? '',
      phone: order.phone ?? currentUser?.phone ?? '',
      text: raw,
    }
  }

  const composed = [raw.detail, raw.area, raw.district, raw.division]
    .filter(Boolean)
    .join(', ')
  return {
    name: raw.name ?? order.name ?? order.customerName ?? currentUser?.name ?? '',
    phone: raw.phone ?? order.phone ?? currentUser?.phone ?? '',
    text: raw.address || composed,
  }
}

const steps = [
  {
    key: 'new',
    title: 'Order Placed',
    text: 'Your order has been received and is waiting for confirmation.',
  },
  {
    key: 'processing',
    title: 'Order Approved',
    text: 'Your order is confirmed and is being prepared.',
  },
  {
    key: 'shipped',
    title: 'Order Shipped',
    text: 'Your order has been handed over to the courier.',
  },
  {
    key: 'delivered',
    title: 'Order Delivered',
    text: 'Your order has been delivered.',
  },
]

export const buildTracking = order => {
  if (Array.isArray(order.tracking) && order.tracking.length) {
    return [...order.tracking]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(entry => ({
        title: entry.title,
        text: entry.description ?? entry.text,
        date: entry.date,
        done: true,
      }))
  }
  const dateFor = value => value || order.date
  if (order.status === 'cancelled') {
    return [
      {
        title: 'Order Canceled',
        text: 'This order has been canceled.',
        date: order.cancelledAt,
        done: true,
        danger: true,
      },
      { ...steps[0], date: order.date, done: true },
    ]
  }
  if (order.status === 'delivered') {
    return [
      { title: 'Order Delivered', text: 'আপনার অর্ডারটি সফলভাবে ডেলিভারি করা হয়েছে।', date: dateFor(order.deliveredAt || order.statusDates?.delivered), done: true },
      { title: 'Hand over to Courier', text: 'পণ্যটি কুরিয়ার হ্যান্ডওভার করা হয়েছে।', date: dateFor(order.shippedAt || order.statusDates?.shipped), done: true },
      { title: 'Order Ready to Ship', text: 'প্যাকেজিং সম্পন্ন হয়েছে এবং কুরিয়ারের জন্য প্রস্তুত।', date: dateFor(order.readyAt), done: true },
      { title: 'Order Approved', text: 'অর্ডারটি নিশ্চিত করা হয়েছে এবং প্রস্তুত করা হচ্ছে।', date: dateFor(order.approvedAt || order.statusDates?.processing), done: true },
      { title: 'Order Placed', text: 'আপনার অর্ডারটি গ্রহণ করা হয়েছে।', date: order.date, done: true },
    ]
  }
  if (order.status === 'shipped') {
    return [
      { title: 'Hand over to Courier', text: 'পণ্যটি কুরিয়ার হ্যান্ডওভার করা হয়েছে।', date: dateFor(order.shippedAt || order.statusDates?.shipped), done: true },
      { title: 'Order Ready to Ship', text: 'প্যাকেজিং সম্পন্ন হয়েছে এবং কুরিয়ারের জন্য প্রস্তুত।', date: dateFor(order.readyAt), done: true },
      { title: 'Order Approved', text: 'অর্ডারটি নিশ্চিত করা হয়েছে এবং প্রস্তুত করা হচ্ছে।', date: dateFor(order.approvedAt || order.statusDates?.processing), done: true },
      { title: 'Order Placed', text: 'আপনার অর্ডারটি গ্রহণ করা হয়েছে।', date: order.date, done: true },
    ]
  }
  if (order.status === 'processing') {
    return [
      { title: 'Order Approved', text: 'অর্ডারটি নিশ্চিত করা হয়েছে এবং প্রস্তুত করা হচ্ছে।', date: dateFor(order.approvedAt || order.statusDates?.processing), done: true },
      { title: 'Order Placed', text: 'আপনার অর্ডারটি গ্রহণ করা হয়েছে।', date: order.date, done: true },
    ]
  }
  return [{ title: 'Order Placed', text: 'আপনার অর্ডারটি গ্রহণ করা হয়েছে।', date: order.date, done: true }]
}
