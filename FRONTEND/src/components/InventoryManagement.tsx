import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Package, Plus, Minus, AlertTriangle, TrendingDown, TrendingUp, Search, CreditCard as Edit3, BarChart3 } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: 'cannulas' | 'syringes' | 'gloves' | 'saline' | 'antiseptic' | 'dressings';
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  unit: string;
  cost_per_unit: number;
  supplier: string;
  last_restocked: string;
  expiry_date?: string;
}

const InventoryManagement: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'cannulas',
    current_stock: 0,
    minimum_stock: 10,
    maximum_stock: 100,
    unit: 'pieces',
    cost_per_unit: 0,
    supplier: '',
    expiry_date: ''
  });

  useEffect(() => {
    fetchInventory();
  }, [user]);

  useEffect(() => {
    filterInventory();
  }, [searchTerm, selectedCategory, inventory]);

  const fetchInventory = async () => {
    try {
      // Sample inventory data - in real implementation, this would come from database
      const sampleInventory: InventoryItem[] = [
        {
          id: '1',
          name: 'IV Cannula 20G',
          category: 'cannulas',
          current_stock: 45,
          minimum_stock: 50,
          maximum_stock: 200,
          unit: 'pieces',
          cost_per_unit: 2.50,
          supplier: 'MedSupply Co.',
          last_restocked: '2024-01-15',
          expiry_date: '2025-12-31'
        },
        {
          id: '2',
          name: 'IV Cannula 22G',
          category: 'cannulas',
          current_stock: 75,
          minimum_stock: 50,
          maximum_stock: 200,
          unit: 'pieces',
          cost_per_unit: 2.25,
          supplier: 'MedSupply Co.',
          last_restocked: '2024-01-10',
          expiry_date: '2025-12-31'
        },
        {
          id: '3',
          name: 'Disposable Syringes 10ml',
          category: 'syringes',
          current_stock: 25,
          minimum_stock: 30,
          maximum_stock: 150,
          unit: 'pieces',
          cost_per_unit: 0.75,
          supplier: 'Healthcare Plus',
          last_restocked: '2024-01-08',
          expiry_date: '2026-06-30'
        },
        {
          id: '4',
          name: 'Nitrile Gloves (Medium)',
          category: 'gloves',
          current_stock: 180,
          minimum_stock: 100,
          maximum_stock: 500,
          unit: 'pairs',
          cost_per_unit: 0.15,
          supplier: 'SafeGuard Medical',
          last_restocked: '2024-01-12'
        },
        {
          id: '5',
          name: 'Normal Saline 0.9% 100ml',
          category: 'saline',
          current_stock: 15,
          minimum_stock: 20,
          maximum_stock: 100,
          unit: 'bottles',
          cost_per_unit: 1.20,
          supplier: 'PharmaCorp',
          last_restocked: '2024-01-05',
          expiry_date: '2025-08-15'
        },
        {
          id: '6',
          name: 'Chlorhexidine Antiseptic',
          category: 'antiseptic',
          current_stock: 8,
          minimum_stock: 10,
          maximum_stock: 30,
          unit: 'bottles',
          cost_per_unit: 3.50,
          supplier: 'MedClean Solutions',
          last_restocked: '2024-01-01',
          expiry_date: '2025-03-20'
        }
      ];
      
      setInventory(sampleInventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = inventory;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredInventory(filtered);
  };

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.current_stock / item.maximum_stock) * 100;
    
    if (item.current_stock <= item.minimum_stock) {
      return { status: 'low', color: 'text-red-600 bg-red-50', icon: AlertTriangle };
    } else if (percentage <= 30) {
      return { status: 'medium', color: 'text-yellow-600 bg-yellow-50', icon: TrendingDown };
    } else {
      return { status: 'good', color: 'text-green-600 bg-green-50', icon: TrendingUp };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cannulas': return '💉';
      case 'syringes': return '🔬';
      case 'gloves': return '🧤';
      case 'saline': return '💧';
      case 'antiseptic': return '🧴';
      case 'dressings': return '🩹';
      default: return '📦';
    }
  };

  const updateStock = (itemId: string, change: number) => {
    setInventory(inventory.map(item => 
      item.id === itemId 
        ? { ...item, current_stock: Math.max(0, item.current_stock + change) }
        : item
    ));
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        ...itemForm,
        last_restocked: new Date().toISOString().split('T')[0]
      };

      setInventory([...inventory, newItem]);
      setItemForm({
        name: '',
        category: 'cannulas',
        current_stock: 0,
        minimum_stock: 10,
        maximum_stock: 100,
        unit: 'pieces',
        cost_per_unit: 0,
        supplier: '',
        expiry_date: ''
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.current_stock <= item.minimum_stock);
  };

  const getTotalValue = () => {
    return inventory.reduce((total, item) => total + (item.current_stock * item.cost_per_unit), 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{getLowStockItems().length}</p>
              <p className="text-sm text-gray-600">Low Stock Alerts</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">${getTotalValue().toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total Value</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((inventory.filter(item => item.current_stock > item.minimum_stock).length / inventory.length) * 100)}%
              </p>
              <p className="text-sm text-gray-600">Stock Health</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Management</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items or suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="cannulas">Cannulas</option>
              <option value="syringes">Syringes</option>
              <option value="gloves">Gloves</option>
              <option value="saline">Saline</option>
              <option value="antiseptic">Antiseptic</option>
              <option value="dressings">Dressings</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                const StatusIcon = stockStatus.icon;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getCategoryIcon(item.category)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{item.category}</div>
                          {item.expiry_date && (
                            <div className="text-xs text-gray-400">
                              Expires: {new Date(item.expiry_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.current_stock} / {item.maximum_stock} {item.unit}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            item.current_stock <= item.minimum_stock ? 'bg-red-600' :
                            (item.current_stock / item.maximum_stock) <= 0.3 ? 'bg-yellow-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min((item.current_stock / item.maximum_stock) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {stockStatus.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${item.cost_per_unit.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        Total: ${(item.current_stock * item.cost_per_unit).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateStock(item.id, -1)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove 1"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateStock(item.id, 1)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Add 1"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Inventory Item</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="cannulas">Cannulas</option>
                  <option value="syringes">Syringes</option>
                  <option value="gloves">Gloves</option>
                  <option value="saline">Saline</option>
                  <option value="antiseptic">Antiseptic</option>
                  <option value="dressings">Dressings</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    value={itemForm.current_stock}
                    onChange={(e) => setItemForm({ ...itemForm, current_stock: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit *
                  </label>
                  <input
                    type="text"
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="pieces, bottles, etc."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Stock *
                  </label>
                  <input
                    type="number"
                    value={itemForm.minimum_stock}
                    onChange={(e) => setItemForm({ ...itemForm, minimum_stock: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Stock *
                  </label>
                  <input
                    type="number"
                    value={itemForm.maximum_stock}
                    onChange={(e) => setItemForm({ ...itemForm, maximum_stock: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost per Unit *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={itemForm.cost_per_unit}
                  onChange={(e) => setItemForm({ ...itemForm, cost_per_unit: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier *
                </label>
                <input
                  type="text"
                  value={itemForm.supplier}
                  onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={itemForm.expiry_date}
                  onChange={(e) => setItemForm({ ...itemForm, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;