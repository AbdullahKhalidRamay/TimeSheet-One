import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2 } from "lucide-react";
import { saveProduct, generateId } from "@/services/storage";
import { getCurrentUser } from "@/lib/auth";
import { Product } from "@/validation/index";
import { toast } from "@/components/ui/sonner";

interface CreateProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProduct?: Product | null;
}

export default function CreateProductForm({ isOpen, onClose, onSuccess, editingProduct }: CreateProductFormProps) {
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [isBillable, setIsBillable] = useState(false);

  const currentUser = getCurrentUser();
  const isEditing = !!editingProduct;

  // Load editing data when editingProduct changes
  useEffect(() => {
    if (editingProduct && isOpen) {
      setProductName(editingProduct.name);
      setProductDescription(editingProduct.productDescription);
      setIsBillable(editingProduct.isBillable);
    } else if (!isOpen) {
      // Reset form when closing
      setProductName("");
      setProductDescription("");
      setIsBillable(false);
    }
  }, [editingProduct, isOpen]);

  const handleSubmit = () => {
    if (!productName.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    const product: Product = {
      id: isEditing ? editingProduct!.id : generateId(),
      name: productName,
      productDescription: productDescription,
      isBillable,
      createdBy: isEditing ? editingProduct!.createdBy : (currentUser?.id || "Unknown"),
      createdAt: isEditing ? editingProduct!.createdAt : new Date().toISOString()
    };

    saveProduct(product);
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setProductName("");
    setProductDescription("");
    setIsBillable(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg sm:max-w-xl h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold text-card-foreground flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isEditing ? 'bg-orange-100/30' : 'bg-green-100/30'}`}>
              {isEditing ? (
                <Edit2 className="h-6 w-6 text-orange-600" />
              ) : (
                <Plus className="h-6 w-6 text-green-600" />
              )}
            </div>
            <span>{isEditing ? 'Edit Product' : 'Create New Product'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6 bg-muted/30 rounded-lg border">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="productName" className="text-sm font-medium text-foreground">Product Name</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name"
              className="bg-background border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Product Description */}
          <div className="space-y-2">
            <Label htmlFor="productDescription" className="text-sm font-medium text-foreground">Product Description</Label>
            <Textarea
              id="productDescription"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="Enter a brief product description"
              className="bg-background border-gray-300 focus:ring-2 focus:ring-primary/20"
              rows={3}
            />
          </div>

          {/* Billable Status */}
          <div className="flex items-center space-x-3">
            <Switch
              id="isBillable"
              checked={isBillable}
              onCheckedChange={setIsBillable}
            />
            <Label htmlFor="isBillable" className="text-sm font-medium text-foreground">
              💰 Billable Product
            </Label>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center border-t border-border pt-6">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="border-border text-foreground hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200"
          >
            {isEditing ? (
              <>
                <Edit2 className="h-5 w-5 mr-2" />
                Update Product
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Create Product
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
