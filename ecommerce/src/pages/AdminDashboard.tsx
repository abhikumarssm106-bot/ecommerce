import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { X, Edit, Trash2, Plus, RefreshCw, ShoppingBag, Settings, Layers, LogOut } from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  showToast: (msg: string, isSuccess?: boolean) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, showToast }) => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Forms states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    price: 0,
    stock: 0,
    sku: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await api.get('/products?limit=100');
      setProducts(prodRes.data.data);

      // Fetch categories for product form dropdown
      const dbProducts = prodRes.data.data;
      const extractedCats = dbProducts
        .map((p: any) => p.category)
        .filter((cat: any, index: number, self: any[]) =>
          cat && cat.id && self.findIndex(c => c && c.id === cat.id) === index
        );

      if (extractedCats.length > 0) {
        setCategories(extractedCats);
      } else {
        setCategories([
          { id: 'groceries', name: 'Groceries' },
          { id: 'snacks', name: 'Snacks' },
          { id: 'drinks', name: 'Drinks' },
          { id: 'laundry', name: 'Laundry Essentials' },
        ]);
      }

      // Fetch orders (admin endpoint)
      const ordRes = await api.get('/orders');
      setOrders(ordRes.data.data);
    } catch (err: any) {
      console.error(err);
      showToast('Error loading dashboard data', false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // Update product
        await api.put(`/products/${editingProduct.id}`, {
          name: productForm.name,
          slug: productForm.slug,
          description: productForm.description,
          categoryId: editingProduct.categoryId, // Keep original category for simplicity
          isActive: true,
        });
        showToast('Product updated successfully!', true);
      } else {
        // Create product
        const categoryId = productForm.categoryId || categories[0]?.id || 'groceries';

        await api.post('/products', {
          name: productForm.name,
          slug: productForm.slug,
          description: productForm.description,
          categoryId,
          variants: [
            {
              sku: productForm.sku || `SKU-${Date.now()}`,
              price: productForm.price,
              stock: productForm.stock,
              size: 'Standard',
            }
          ],
          images: [
            {
              url: 'images/prod_bananas.png', // Default placeholder
              isPrimary: true,
              position: 1,
            }
          ]
        });
        showToast('Product created successfully!', true);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to save product';
      showToast(msg, false);
    }
  };

  const handleEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      slug: prod.slug,
      description: prod.description || '',
      categoryId: prod.category?.name || '',
      price: prod.price || 0,
      stock: prod.variants?.[0]?.stock || 0,
      sku: prod.variants?.[0]?.sku || '',
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      showToast('Product deleted successfully!', true);
      fetchData();
    } catch {
      showToast('Failed to delete product', false);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      showToast(`Order status updated to ${status}!`, true);
      fetchData();
    } catch {
      showToast('Failed to update order status', false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--clr-bg)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      {/* Admin Header */}
      <header style={{ height: '72px', borderBottom: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <Settings className="spin-hover" size={24} style={{ color: 'var(--clr-accent)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>MegaMart Admin Center</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <button className="btn-ghost" onClick={fetchData} style={{ padding: '8px 12px' }} aria-label="Refresh Data">
            <RefreshCw size={18} />
          </button>
          <button
            className="btn-ghost"
            onClick={async () => {
              await logout();
              onClose();
            }}
            style={{ color: 'var(--clr-danger)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
          <button className="checkout-close-btn" onClick={onClose} aria-label="Close Dashboard">
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Main Panel Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar Nav */}
        <aside style={{ width: '240px', borderRight: '1px solid var(--clr-border)', background: 'var(--clr-bg-secondary)', padding: 'var(--space-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('products')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: activeTab === 'products' ? 'var(--clr-accent)' : 'transparent',
                color: activeTab === 'products' ? '#ffffff' : 'var(--clr-text)',
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all var(--transition)'
              }}
            >
              <Layers size={18} />
              Products List
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: activeTab === 'orders' ? 'var(--clr-accent)' : 'transparent',
                color: activeTab === 'orders' ? '#ffffff' : 'var(--clr-text)',
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all var(--transition)'
              }}
            >
              <ShoppingBag size={18} />
              Customer Orders
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <main style={{ flex: 1, padding: 'var(--space-xl)', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <p style={{ fontWeight: 600, color: 'var(--clr-text-secondary)' }}>Loading panel resources...</p>
            </div>
          ) : (
            <>
              {/* Products Tab */}
              {activeTab === 'products' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Product Inventory</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-secondary)' }}>Update and manage standard product listings.</p>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setEditingProduct(null);
                        setProductForm({ name: '', slug: '', description: '', categoryId: categories[0]?.id || '', price: 0, stock: 0, sku: '' });
                        setIsProductModalOpen(true);
                      }}
                      style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={18} />
                      Add Product
                    </button>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--clr-border)', color: 'var(--clr-text-secondary)', fontWeight: 600 }}>
                        <th style={{ padding: '12px' }}>Name</th>
                        <th style={{ padding: '12px' }}>Slug</th>
                        <th style={{ padding: '12px' }}>Category</th>
                        <th style={{ padding: '12px' }}>Price</th>
                        <th style={{ padding: '12px' }}>Stock</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((prod) => (
                        <tr key={prod.id} style={{ borderBottom: '1px solid var(--clr-border)', transition: 'background var(--transition)' }} className="table-row-hover">
                          <td style={{ padding: '12px', fontWeight: 600 }}>{prod.name}</td>
                          <td style={{ padding: '12px', color: 'var(--clr-text-secondary)', fontSize: '0.85rem' }}>{prod.slug}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: 'var(--radius-full)', background: 'var(--clr-surface)', fontSize: '0.75rem', fontWeight: 600 }}>
                              {prod.category?.name || 'General'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700 }}>${prod.price}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ color: prod.variants?.[0]?.stock > 5 ? 'var(--clr-success)' : 'var(--clr-danger)', fontWeight: 600 }}>
                              {prod.variants?.[0]?.stock ?? 0} left
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button className="btn-ghost" onClick={() => handleEditProduct(prod)} style={{ padding: '6px', marginRight: '6px' }} aria-label="Edit Product">
                              <Edit size={16} />
                            </button>
                            <button className="btn-ghost" onClick={() => handleDeleteProduct(prod.id)} style={{ padding: '6px', color: 'var(--clr-danger)' }} aria-label="Delete Product">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Customer Transactions</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-secondary)' }}>Review order pipelines and dispatch statuses.</p>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--clr-border)', color: 'var(--clr-text-secondary)', fontWeight: 600 }}>
                        <th style={{ padding: '12px' }}>Order ID</th>
                        <th style={{ padding: '12px' }}>Placed On</th>
                        <th style={{ padding: '12px' }}>Total Amount</th>
                        <th style={{ padding: '12px' }}>Items</th>
                        <th style={{ padding: '12px' }}>Current Status</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Quick Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: '12px', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'monospace' }}>{order.id}</td>
                          <td style={{ padding: '12px', fontSize: '0.85rem' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '12px', fontWeight: 700 }}>${Number(order.total).toFixed(2)}</td>
                          <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--clr-text-secondary)' }}>
                            {order.orderItems?.map((i: any) => `${i.productName} (x${i.quantity})`).join(', ')}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background:
                                  order.status === 'DELIVERED'
                                    ? '#D1FAE5'
                                    : order.status === 'SHIPPED'
                                    ? '#DBEAFE'
                                    : order.status === 'PAID'
                                    ? '#FEF3C7'
                                    : '#F3F4F6',
                                color:
                                  order.status === 'DELIVERED'
                                    ? '#065F46'
                                    : order.status === 'SHIPPED'
                                    ? '#1E40AF'
                                    : order.status === 'PAID'
                                    ? '#92400E'
                                    : '#374151',
                              }}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              style={{ padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', background: 'var(--clr-bg)' }}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="PAID">PAID</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Product Form Modal */}
      {isProductModalOpen && (
        <div className="checkout-modal-overlay open" onClick={(e) => e.target === e.currentTarget && setIsProductModalOpen(false)}>
          <div className="checkout-modal" style={{ maxWidth: '500px' }}>
            <div className="checkout-modal-header">
              <h3>{editingProduct ? 'Modify Product' : 'Add New Product'}</h3>
              <button className="checkout-close-btn" onClick={() => setIsProductModalOpen(false)} aria-label="Close Product Modal">
                <X size={20} />
              </button>
            </div>
            <div className="checkout-modal-body" style={{ padding: 'var(--space-md)' }}>
              <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Fresh Mangoes"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>URL Slug</label>
                  <input
                    type="text"
                    value={productForm.slug}
                    onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                    placeholder="e.g. fresh-mangoes"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Product details..."
                    required
                  />
                </div>

                {!editingProduct && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                      <div className="form-group">
                        <label>Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Stock Qty</label>
                        <input
                          type="number"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value, 10) })}
                          required
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                      <div className="form-group">
                        <label>Category</label>
                        <select
                          value={productForm.categoryId}
                          onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                          style={{ padding: '10px', width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', background: 'var(--clr-bg)' }}
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Base SKU</label>
                        <input
                          type="text"
                          value={productForm.sku}
                          onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                          placeholder="e.g. MNG-STD"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <button type="submit" className="btn-primary" style={{ marginTop: '10px', justifyContent: 'center', color: '#ffffff' }}>
                  Save Product
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
