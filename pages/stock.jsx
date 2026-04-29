import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNotification } from "@/contexts/NotificationContext";

import StockCard from "@/components/stock/StockCard";
import StockForm from "@/components/stock/StockForm";

export default function Stock() {
  const [showForm, setShowForm] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data: medicines = [] } = useQuery({
    queryKey: ['activeMedicines'],
    queryFn: async () => {
      // Backend now uses session to filter by user automatically
      return base44.entities.Medicine.filter({ 
        active: true 
      });
    },
    initialData: [],
  });

  const { data: stocks = [], isLoading } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => {
      // Backend now uses session to filter by user automatically
      return base44.entities.Stock.filter({}, '-updated_date');
    },
    initialData: [],
  });

  const createStockMutation = useMutation({
    mutationFn: async (stockData) => {
      // Backend now sets created_by from session automatically
      const stock = await base44.entities.Stock.create(stockData);
      
      if (stockData.quantity <= stockData.threshold) {
        // Show popup notification
        showNotification({
          notification_type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${stockData.medicine_name} stock is low (${stockData.quantity} ${stockData.unit} remaining)`,
          medicine_name: stockData.medicine_name,
          priority: 'high'
        });

        // Create notification in database
        await base44.entities.Notification.create({
          medicine_id: stockData.medicine_id,
          medicine_name: stockData.medicine_name,
          notification_type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${stockData.medicine_name} stock is low (${stockData.quantity} ${stockData.unit} remaining)`,
          priority: 'high'
        });
      }
      
      return stock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      setShowForm(false);
      setEditingStock(null);
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const user = await base44.auth.me();
      const stock = await base44.entities.Stock.update(id, data);
      
      if (data.quantity <= data.threshold) {
        // Show popup notification
        const notificationType = data.quantity === 0 ? 'out_of_stock' : 'low_stock';
        const title = data.quantity === 0 ? 'Out of Stock' : 'Low Stock Alert';
        const message = data.quantity === 0 
          ? `${data.medicine_name} is out of stock!`
          : `${data.medicine_name} stock is low (${data.quantity} ${data.unit} remaining)`;
        const priority = data.quantity === 0 ? 'urgent' : 'high';

        showNotification({
          notification_type: notificationType,
          title: title,
          message: message,
          medicine_name: data.medicine_name,
          priority: priority
        });

        // Create notification in database
        await base44.entities.Notification.create({
          medicine_id: data.medicine_id,
          medicine_name: data.medicine_name,
          notification_type: notificationType,
          title: title,
          message: message,
          priority: priority
        });
      }
      
      return stock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      setShowForm(false);
      setEditingStock(null);
    },
  });

  const deleteStockMutation = useMutation({
    mutationFn: (id) => base44.entities.Stock.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
    },
  });

  const handleSubmit = (stockData) => {
    if (editingStock) {
      updateStockMutation.mutate({ id: editingStock.id, data: stockData });
    } else {
      createStockMutation.mutate(stockData);
    }
  };

  const handleEdit = (stock) => {
    setEditingStock(stock);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this stock entry?")) {
      deleteStockMutation.mutate(id);
    }
  };

  const filteredStocks = stocks.filter(stock =>
    stock.medicine_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = stocks.filter(s => s.quantity <= s.threshold).length;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Stock Tracking</h1>
            <p className="text-gray-600 mt-2 text-lg">
              Monitor your medicine inventory
              {lowStockCount > 0 && (
                <span className="ml-2 text-red-600 font-semibold">
                  • {lowStockCount} low stock alert{lowStockCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => {
              setEditingStock(null);
              setShowForm(!showForm);
            }}
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white text-lg px-6 py-6"
            disabled={medicines.length === 0}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Stock Entry
          </Button>
        </div>

        {showForm && (
          <StockForm
            stock={editingStock}
            medicines={medicines}
            existingStocks={stocks}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingStock(null);
            }}
            isLoading={createStockMutation.isPending || updateStockMutation.isPending}
          />
        )}

        <Card className="shadow-lg border-none mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search stock by medicine name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 text-lg py-6"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading stock information...</p>
          </div>
        ) : filteredStocks.length === 0 ? (
          <Card className="shadow-lg border-none">
            <CardContent className="text-center py-16">
              <Plus className="w-24 h-24 text-blue-200 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                {searchQuery ? "No stock entries found" : "No stock entries yet"}
              </h3>
              <p className="text-gray-600 text-lg">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Start tracking your medicine inventory"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStocks.map((stock) => (
              <StockCard
                key={stock.id}
                stock={stock}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}