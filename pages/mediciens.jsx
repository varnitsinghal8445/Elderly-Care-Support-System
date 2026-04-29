import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

import MedicineCard from "@/components/medicines/MedicineCard";
import MedicineForm from "@/components/medicines/MedicineForm";

export default function Medicines() {
  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: medicines = [], isLoading, error } = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      // Backend now uses session to filter by user automatically
      return base44.entities.Medicine.filter({}, '-created_date');
    },
    initialData: [],
    retry: 3,
    retryDelay: 1000,
  });

  const createMedicineMutation = useMutation({
    mutationFn: async (medicineData) => {
      // Backend now sets created_by from session automatically
      return base44.entities.Medicine.create(medicineData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
      setShowForm(false);
      setEditingMedicine(null);
    },
  });

  const updateMedicineMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Medicine.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
      setShowForm(false);
      setEditingMedicine(null);
    },
  });

  const deleteMedicineMutation = useMutation({
    mutationFn: (id) => base44.entities.Medicine.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });

  const handleSubmit = (medicineData) => {
    if (editingMedicine) {
      updateMedicineMutation.mutate({ id: editingMedicine.id, data: medicineData });
    } else {
      createMedicineMutation.mutate(medicineData);
    }
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this medicine?")) {
      deleteMedicineMutation.mutate(id);
    }
  };

  const filteredMedicines = medicines.filter(med =>
    med.med_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.prescribed_by?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Medicines</h1>
            <p className="text-gray-600 mt-2 text-lg">Manage your medicine list</p>
          </div>
          <Button
            size="lg"
            onClick={() => {
              setEditingMedicine(null);
              setShowForm(!showForm);
            }}
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white text-lg px-6 py-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Medicine
          </Button>
        </div>

        {showForm && (
          <MedicineForm
            medicine={editingMedicine}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingMedicine(null);
            }}
            isLoading={createMedicineMutation.isPending || updateMedicineMutation.isPending}
          />
        )}

        <Card className="shadow-lg border-none mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search medicines by name or doctor..."
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
            <p className="text-gray-500 mt-4">Loading medicines...</p>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <Card className="shadow-lg border-none">
            <CardContent className="text-center py-16">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                {searchQuery ? "No medicines found" : "No medicines added yet"}
              </h3>
              <p className="text-gray-600 text-lg">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Start by adding your first medicine"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedicines.map((medicine) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
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