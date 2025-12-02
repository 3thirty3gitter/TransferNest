
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  coverImage?: string;
  tags: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'welcome-to-dtf-wholesale',
    title: 'Welcome to DTF Wholesale',
    excerpt: 'We are excited to launch our new platform for custom DTF transfers. Learn more about our high-quality prints and fast turnaround times.',
    content: `
      <h2>Welcome to the Future of DTF Printing</h2>
      <p>We are thrilled to announce the launch of DTF Wholesale, your premier destination for high-quality Direct-to-Film (DTF) transfers in Canada.</p>
      
      <h3>Why Choose DTF Wholesale?</h3>
      <p>Our mission is simple: to provide businesses and creators with the best DTF transfers on the market. Here's what sets us apart:</p>
      <ul>
        <li><strong>Premium Quality:</strong> We use top-of-the-line printers and inks to ensure vibrant, durable prints that last.</li>
        <li><strong>Fast Turnaround:</strong> We understand that time is money. That's why we offer quick production times to get your orders out the door fast.</li>
        <li><strong>Easy Ordering:</strong> Our custom gang sheet builder makes it easy to upload your designs and maximize your print area.</li>
      </ul>

      <h3>Get Started Today</h3>
      <p>Ready to experience the difference? Head over to our <a href="/nesting-tool">Gang Sheet Builder</a> and start creating your custom transfers today.</p>
    `,
    date: '2025-12-01',
    author: 'The DTF Wholesale Team',
    tags: ['Announcement', 'DTF Printing'],
    coverImage: '/images/blog/welcome.jpg' // Placeholder
  },
  {
    slug: 'tips-for-perfect-gang-sheets',
    title: 'Tips for Creating the Perfect Gang Sheet',
    excerpt: 'Maximize your savings and print quality with these expert tips for arranging your designs on a gang sheet.',
    content: `
      <h2>Mastering the Art of the Gang Sheet</h2>
      <p>Creating a gang sheet is a great way to save money and get multiple designs printed at once. Here are some tips to help you get the most out of your space:</p>

      <h3>1. Watch Your Spacing</h3>
      <p>While it's tempting to cram as many designs as possible onto a sheet, make sure to leave enough space between them for cutting. We recommend at least 0.25" to 0.5" of space.</p>

      <h3>2. High-Resolution Images</h3>
      <p>Always use high-resolution images (300 DPI or higher) with transparent backgrounds. This ensures your prints look crisp and professional.</p>

      <h3>3. Check Your Dimensions</h3>
      <p>Double-check the dimensions of your designs before uploading. Our builder allows you to resize, but starting with the correct size is always best.</p>

      <h3>4. Use Our Auto-Nest Feature</h3>
      <p>Don't want to manually arrange everything? Our smart nesting tool can automatically arrange your images to minimize waste and maximize efficiency.</p>
    `,
    date: '2025-12-05',
    author: 'Design Team',
    tags: ['Tips & Tricks', 'Design'],
  }
];

export function getAllPosts(): BlogPost[] {
  return blogPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}
