import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Edit2, Trash2 } from "lucide-react";
import { Product } from "@/validation/index";
import { getCurrentUser } from "@/lib/auth";
import { rolePermissions } from "@/validation/index";
import { useProducts } from "@/hooks/useData";

interface ProductsTabProps {
  filterBySearch: <T extends { name: string }>(items: T[]) => T[];
  setProductFormOpen: (open: boolean) => void;
  setEditingProduct: (product: Product | null) => void;
  handleDeleteProduct: (productId: string) => void;
}

export default function ProductsTab({
  filterBySearch,
  setProductFormOpen,
  setEditingProduct,
  handleDeleteProduct,
}: ProductsTabProps) {
  const currentUser = getCurrentUser();
  const permissions = rolePermissions[currentUser?.role || 'employee'];

  const { products, loading: productsLoading } = useProducts();

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setProductFormOpen(true);
  }, [setEditingProduct, setProductFormOpen]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Products</h2>
        <Button onClick={() => setProductFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Product
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>All Products</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filterBySearch(products).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No products found</TableCell>
                </TableRow>
              ) : filterBySearch(products).map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.productDescription || "N/A"}</TableCell>
                  <TableCell>{product.createdBy}</TableCell>
                  <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className="bg-success text-success-foreground">Active</Badge>
                  </TableCell>
                  <TableCell>
                    {permissions.canManageProjects && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
