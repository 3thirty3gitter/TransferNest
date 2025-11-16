# Initial Product Setup

Since you already have 2 working products (13" and 17" Gang Sheets), add them to the products database through the admin UI:

## Access the Products Page

1. Go to: `https://your-domain.com/admin/products`
2. Sign in with your admin account

## Add Product 1: 13" Gang Sheet

Click "Add New Product" and enter:

- **Product Name:** `13" Gang Sheet`
- **Sheet Size:** `13 inches`
- **Description:** `Perfect for standard t-shirts, logos, and smaller designs. The cost-effective choice for most businesses.`
- **Price Per Inch:** `0.45`
- **Base Price:** `0` (leave as zero)
- **Active:** ✅ Checked

### Optional Styling Fields (for matching current design):

After creating, you can edit the product document in Firestore directly to add:
```json
{
  "badge": "MOST POPULAR",
  "badgeColor": "from-blue-500 to-cyan-500",
  "gradient": "from-blue-400 to-cyan-400",
  "buttonGradient": "from-blue-600 to-cyan-600",
  "buttonHoverGradient": "from-blue-700 to-cyan-700",
  "checkmarkColor": "text-cyan-400",
  "features": [
    "Ideal for logos & standard designs",
    "Most economical option",
    "Perfect for t-shirt businesses"
  ]
}
```

## Add Product 2: 17" Gang Sheet

Click "Add New Product" and enter:

- **Product Name:** `17" Gang Sheet`
- **Sheet Size:** `17 inches`
- **Description:** `Ideal for oversized prints, hoodies, and maximizing designs per sheet for high-volume orders.`
- **Price Per Inch:** `0.59`
- **Base Price:** `0` (leave as zero)
- **Active:** ✅ Checked

### Optional Styling Fields:

```json
{
  "badge": "MAXIMUM SIZE",
  "badgeColor": "from-purple-500 to-pink-500",
  "gradient": "from-purple-400 to-pink-400",
  "buttonGradient": "from-purple-600 to-pink-600",
  "buttonHoverGradient": "from-purple-700 to-pink-700",
  "checkmarkColor": "text-purple-400",
  "features": [
    "Perfect for oversized designs",
    "More designs per sheet",
    "Great for hoodies & jackets"
  ]
}
```

## Result

Once added:
- ✅ Products will appear in the admin products page
- ✅ Homepage will dynamically load and display them
- ✅ Any new products added will automatically appear on the homepage in the same section
- ✅ Products can be edited/disabled from the admin panel

## Adding More Products Later

Simply use the "Add New Product" button in the admin panel. All products will:
- Display in the same grid on the homepage
- Follow the same card design
- Be sorted by sheet size
- Only show if marked as "Active"
