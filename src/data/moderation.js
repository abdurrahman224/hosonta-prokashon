const messages = [
  {
    id: 'message-1',
    type: 'contact',
    name: 'মাহমুদা রহমান',
    email: 'mahmuda@example.com',
    subject: 'বই অর্ডার সম্পর্কে',
    message: 'আমার অর্ডারটি কবে পাঠানো হবে জানতে চাই।',
    status: 'open',
    createdAt: 'আজ, ১০:৩০',
  },
  {
    id: 'message-2',
    type: 'comment',
    name: 'রাকিব হাসান',
    email: 'rakib@example.com',
    subject: 'বইয়ের রিভিউ',
    message: 'এই বইটি অসাধারণ, সবাইকে পড়ার অনুরোধ করছি।',
    status: 'resolved',
    createdAt: 'গতকাল, ১৬:২০',
  },
  {
    id: 'message-3',
    type: 'contact',
    name: 'অজ্ঞাত ব্যবহারকারী',
    email: 'spam@example.com',
    subject: 'অপ্রাসঙ্গিক অফার',
    message: 'আপনার সাইটে বিজ্ঞাপন প্রকাশের জন্য এই লিংকে ক্লিক করুন।',
    status: 'spam',
    createdAt: 'গতকাল, ০৯:১৫',
  },
]

export default messages
