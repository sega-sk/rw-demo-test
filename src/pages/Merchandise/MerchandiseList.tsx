import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Grid, List } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import FormField from '../../components/Forms/FormField';
import Input from '../../components/Forms/Input';
import Textarea from '../../components/Forms/Textarea';
import ImageUploader from '../../components/UI/ImageUploader';
import { apiService } from '../../services/api';
import { useApi, useMutation } from '../../hooks/useApi';
import { useToastContext } from '../../contexts/ToastContext';
import type { Merchandise, MerchandiseCreate, MerchandiseUpdate } from '../../services/api';
import Tooltip from '../../components/UI/Tooltip';
import OptimizedImage from '../../components/UI/OptimizedImage';

export default function MerchandiseList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useToastContext();
  const [selectedItem, setSelectedItem] = useState<Merchandise | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [newTag, setNewTag] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Form data for add/edit
  const [formData, setFormData] = useState<MerchandiseCreate>({
    title: '',
    subtitle: '',
    description: '',
    price: 0,
    photos: [],
    keywords: [],
    product_ids: [],
    slug: '',
  });

  // API hooks
  const { data: merchandiseData, loading, execute: refetchMerchandise } = useApi(
    () => apiService.getMerchandise({ q: searchTerm, limit: 100 }),
    { 
      immediate: true,
      cacheKey: `merchandise-list-${searchTerm}`,
      cacheTTL: 2 * 60 * 1000,
      staleWhileRevalidate: true
    }
  );

  const { data: allProductsData } = useApi(
    () => apiService.getProducts({ limit: 100 }),
    { immediate: true, cacheKey: 'merch-list-all-products', cacheTTL: 5 * 60 * 1000, staleWhileRevalidate: true }
  );

  const { mutate: createMerchandise, loading: creating } = useMutation(
    (data: MerchandiseCreate) => apiService.createMerchandise(data)
  );

  const { mutate: updateMerchandise, loading: updating } = useMutation(
    ({ id, data }: { id: string; data: MerchandiseUpdate }) => apiService.updateMerchandise(id, data)
  );

  const { mutate: deleteMerchandise, loading: deleting } = useMutation(
    (id: string) => apiService.deleteMerchandise(id)
  );

  // Search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        refetchMerchandise();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, refetchMerchandise]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (item: Merchandise) => {
    setSelectedItem(item);
    setFormData({
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description || '',
      price: Number(item.price) || 0,
      photos: item.photos,
      keywords: item.keywords,
      // Ensure product_ids is always an array of strings and matches the response
      product_ids: Array.isArray(item.product_ids)
        ? item.product_ids.map(String)
        : [],
      slug: item.slug || '',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this merchandise item?')) {
      try {
        await deleteMerchandise(itemId);
        success('Merchandise Deleted', 'Merchandise item has been deleted successfully!');
        refetchMerchandise();
      } catch (err) {
        error('Delete Failed', 'Failed to delete merchandise.');
      }
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.keywords.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert('Please login to save merchandise');
      return;
    }

    if (!formData.title.trim() || !formData.price.toString().trim()) {
      alert('Title and price are required.');
      return;
    }

    try {
      if (selectedItem) {
        await updateMerchandise({
          id: selectedItem.id,
          data: {
            ...formData,
            product_ids: Array.isArray(formData.product_ids)
              ? formData.product_ids.map(String)
              : [],
          },
        });
        success('Merchandise updated!', 'Merchandise updated successfully!');
      } else {
        await createMerchandise({
          ...formData,
          product_ids: Array.isArray(formData.product_ids)
            ? formData.product_ids.map(String)
            : [],
        });
        success('Merchandise created!', 'Merchandise created successfully!');
      }

      setFormData({
        title: '',
        subtitle: '',
        description: '',
        price: 0,
        photos: [],
        keywords: [],
        product_ids: [],
        slug: '',
      });
      setSelectedItem(null);
      setShowEditModal(false);
      refetchMerchandise();
    } catch (err: any) {
      if (err instanceof Error && err.message.includes('Authentication')) {
        alert('Authentication expired. Please login again.');
        window.location.href = '/admin/login';
      } else {
        error('Save Failed', 'Failed to save merchandise. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      price: 0,
      photos: [],
      keywords: [],
      product_ids: [],
      slug: '',
    });
    setSelectedItem(null);
    setShowEditModal(false);
  };

  // Use API data if available, otherwise use dummy data
  const merchandiseItems = merchandiseData?.rows || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Merchandise</h1>
        
        <div className="flex items-center justify-between mb-4">
          <Button icon={Plus} onClick={() => navigate('/admin/merchandise/add')} className="btn-hover">
            Add New
          </Button>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="Grid view"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search here"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {viewMode === 'list' ? (
            // Table View
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keywords
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {merchandiseItems.map((item) => (
                  <tr key={item.id} className="table-row-hover">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {item.photos[0] ? (
                            <OptimizedImage
                              className="h-12 w-12 rounded-lg object-cover" 
                              src={item.photos[0]} 
                              alt={item.title}
                              size="thumbnail"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-black rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">T-SHIRT</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.subtitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.price}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.keywords.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 text-xs rounded bg-green-100 text-green-600">
                            {tag}
                          </span>
                        ))}
                        {item.keywords.length > 3 && (
                          <Tooltip 
                            content={
                              <div className="max-w-xs">
                                <div className="font-medium mb-2">Additional Tags:</div>
                                <div className="flex flex-wrap gap-1">
                                  {item.keywords.slice(3).map((tag, index) => (
                                    <span key={index} className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            }
                            position="top"
                          >
                            <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 cursor-help hover:bg-gray-200 transition-colors">
                              +{item.keywords.length - 3}
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={Edit}
                          aria-label="Edit"
                          onClick={() => handleEdit(item)}
                          className="btn-hover"
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={Trash2}
                          onClick={() => handleDelete(item.id)}
                          className="btn-hover"
                          loading={deleting}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Grid View (existing implementation)
            <div className="p-6">
              <div className="space-y-6">
                {merchandiseItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-6 card-hover">
                    <div className="flex items-start space-x-6">
                      <div className="w-24 h-24 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.photos[0] ? (
                          <OptimizedImage
                            className="w-24 h-24 rounded-lg object-cover" 
                            src={item.photos[0]} 
                            alt={item.title}
                            size="small"
                          />
                        ) : (
                          <span className="text-white text-xs font-bold">T-SHIRT</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-500 mb-4">{item.subtitle}</p>
                        
                        <div className="mb-4">
                          <span className="text-sm text-gray-500">Price</span>
                          <p className="font-medium">${item.price}</p>
                        </div>

                        <div className="mb-4">
                          <span className="text-sm text-gray-500 block mb-2">Connection Keywords</span>
                          <div className="flex flex-wrap gap-2">
                            {item.keywords.map((tag, index) => (
                              <span 
                                key={index} 
                                className="px-2 py-1 text-xs rounded bg-green-100 text-green-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {item.description && (
                          <div>
                            <span className="text-sm text-gray-500 block mb-2">Description</span>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={Edit}
                          onClick={() => handleEdit(item)}
                          className="btn-hover"
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={Trash2}
                          onClick={() => handleDelete(item.id)}
                          className="btn-hover"
                          loading={deleting}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {merchandiseItems.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No merchandise items found.</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{selectedItem ? 'Edit Merchandise' : 'Add Merchandise'}</h2>
            <form onSubmit={handleSaveItem} className="space-y-4">
              <FormField label="Title" required>
                <Input name="title" value={formData.title} onChange={handleInputChange} required />
              </FormField>
              <FormField label="Subtitle">
                <Input name="subtitle" value={formData.subtitle} onChange={handleInputChange} />
              </FormField>
              <FormField label="Price" required>
                <Input name="price" type="number" value={formData.price} onChange={handleInputChange} required />
              </FormField>
              <FormField label="Description">
                <Textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} />
              </FormField>
              <FormField label="Connection Keywords">
                <div className="flex flex-wrap gap-2 mb-2">
                  {(formData.keywords || []).map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-600">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 hover:text-red-600">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="+Add Keywords"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>Add</Button>
                </div>
              </FormField>
              <FormField label="Related Products">
                <div className="border rounded-lg max-h-48 overflow-y-auto p-2 bg-white">
                  {(allProductsData?.rows || []).map((product) => (
                    <label key={product.id} className="flex items-center space-x-2 mb-1">
                      <input
                        type="checkbox"
                        checked={formData.product_ids?.includes(product.id) || false}
                        onChange={e => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            product_ids: checked
                              ? [...(prev.product_ids || []), product.id]
                              : (prev.product_ids || []).filter(id => id !== product.id)
                          }));
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="text-xs">{product.title}</span>
                    </label>
                  ))}
                </div>
              </FormField>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button type="submit" loading={creating || updating}>Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}