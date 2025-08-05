import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { saveDepartment, generateId } from "@/services/storage";
import { getCurrentUser } from "@/lib/auth";
import { Department, DepartmentFunction, DepartmentDuty, DepartmentSubduty } from "@/validation/index";

interface CreateDepartmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingDepartment?: Department | null;
}

export default function CreateDepartmentForm({ isOpen, onClose, onSuccess, editingDepartment }: CreateDepartmentFormProps) {
  const [departmentName, setDepartmentName] = useState("");
  const [functions, setFunctions] = useState<DepartmentFunction[]>([
    {
      id: generateId(),
      name: "",
      duties: []
    }
  ]);

  const currentUser = getCurrentUser();
  const [isBillable, setIsBillable] = useState(false);
  const isEditing = !!editingDepartment;

  // Load editing data when editingDepartment changes
  useEffect(() => {
    if (editingDepartment && isOpen) {
      setDepartmentName(editingDepartment.name);
      setIsBillable(editingDepartment.isBillable);
      setFunctions(editingDepartment.functions.length > 0 ? editingDepartment.functions : [{
        id: generateId(),
        name: "",
        duties: []
      }]);
    } else if (!isOpen) {
      // Reset form when closing
      setDepartmentName("");
      setIsBillable(false);
      setFunctions([{
        id: generateId(),
        name: "",
        duties: []
      }]);
    }
  }, [editingDepartment, isOpen]);

  const addFunction = () => {
    setFunctions([...functions, {
      id: generateId(),
      name: "",
      duties: []
    }]);
  };

  const removeFunction = (functionId: string) => {
    setFunctions(functions.filter(func => func.id !== functionId));
  };

  const updateFunction = (functionId: string, name: string) => {
    setFunctions(functions.map(func => 
      func.id === functionId ? { ...func, name } : func
    ));
  };

  const addDuty = (functionId: string) => {
    setFunctions(functions.map(func => 
      func.id === functionId ? {
        ...func,
        duties: [...func.duties, {
          id: generateId(),
          name: "",
          description: "",
          subduties: []
        }]
      } : func
    ));
  };

  const removeDuty = (functionId: string, dutyId: string) => {
    setFunctions(functions.map(func => 
      func.id === functionId ? {
        ...func,
        duties: func.duties.filter(duty => duty.id !== dutyId)
      } : func
    ));
  };

  const updateDuty = (functionId: string, dutyId: string, field: keyof DepartmentDuty, value: string) => {
    setFunctions(functions.map(func => 
      func.id === functionId ? {
        ...func,
        duties: func.duties.map(duty => 
          duty.id === dutyId ? { ...duty, [field]: value } : duty
        )
      } : func
    ));
  };

  const addSubduty = (functionId: string, dutyId: string) => {
    setFunctions(functions.map(func => 
      func.id === functionId ? {
        ...func,
        duties: func.duties.map(duty => 
          duty.id === dutyId ? {
            ...duty,
            subduties: [...duty.subduties, {
              id: generateId(),
              name: "",
              description: ""
            }]
          } : duty
        )
      } : func
    ));
  };

  const removeSubduty = (functionId: string, dutyId: string, subdutyId: string) => {
    setFunctions(functions.map(func => 
      func.id === functionId ? {
        ...func,
        duties: func.duties.map(duty => 
          duty.id === dutyId ? {
            ...duty,
            subduties: duty.subduties.filter(subduty => subduty.id !== subdutyId)
          } : duty
        )
      } : func
    ));
  };

  const updateSubduty = (functionId: string, dutyId: string, subdutyId: string, field: keyof DepartmentSubduty, value: string) => {
    setFunctions(functions.map(func => 
      func.id === functionId ? {
        ...func,
        duties: func.duties.map(duty => 
          duty.id === dutyId ? {
            ...duty,
            subduties: duty.subduties.map(subduty => 
              subduty.id === subdutyId ? { ...subduty, [field]: value } : subduty
            )
          } : duty
        )
      } : func
    ));
  };

  const handleSubmit = () => {
    if (!departmentName.trim()) {
      alert("Please enter a department name");
      return;
    }

    const department: Department = {
      id: isEditing ? editingDepartment!.id : generateId(),
      name: departmentName,
      functions: functions.filter(func => func.name.trim()),
      isBillable,
      createdBy: isEditing ? editingDepartment!.createdBy : (currentUser?.name || "Unknown"),
      createdAt: isEditing ? editingDepartment!.createdAt : new Date().toISOString()
    };

    saveDepartment(department);
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setDepartmentName("");
    setFunctions([{
      id: generateId(),
      name: "",
      duties: []
    }]);
setIsBillable(false);
onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-card border-border shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold text-card-foreground flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isEditing ? 'bg-orange-100/30' : 'bg-green-100/30'}`}>
              {isEditing ? (
                <Edit2 className="h-6 w-6 text-orange-600" />
              ) : (
                <Plus className="h-6 w-6 text-green-600" />
              )}
            </div>
            <span>{isEditing ? 'Edit Department' : 'Create New Department'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6 bg-muted/30 rounded-lg border">
          {/* Department Name */}
          <div className="space-y-2">
            <Label htmlFor="departmentName" className="text-sm font-medium text-foreground">Department Name</Label>
            <Input
              id="departmentName"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="Enter department name"
              className="bg-background border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Billable Status */}
          <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border border-border">
            <Switch
              id="isBillable"
              checked={isBillable}
              onCheckedChange={setIsBillable}
            />
            <Label htmlFor="isBillable" className="text-sm font-medium text-card-foreground cursor-pointer">
              <span className="inline-block animate-pulse text-green-600 font-bold mr-1">$</span>
              Billable only
            </Label>
          </div>

          {/* Department Functions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">Department Functions</Label>
              <Button 
                type="button" 
                onClick={addFunction} 
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Function
              </Button>
            </div>

            {functions.map((func, functionIndex) => (
              <Card key={func.id} className="p-4 bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={func.name}
                      onChange={(e) => updateFunction(func.id, e.target.value)}
                      placeholder="Function name"
                      className="flex-1 bg-background border-border focus:ring-2 focus:ring-primary/20"
                    />
                    {functions.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFunction(func.id)}
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Duties */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Duties</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addDuty(func.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Duty
                      </Button>
                    </div>

                    {func.duties.map((duty) => (
                      <Card key={duty.id} className="p-3 ml-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Input
                              value={duty.name}
                              onChange={(e) => updateDuty(func.id, duty.id, 'name', e.target.value)}
                              placeholder="Duty name"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeDuty(func.id, duty.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={duty.description}
                            onChange={(e) => updateDuty(func.id, duty.id, 'description', e.target.value)}
                            placeholder="Duty description"
                            rows={2}
                          />

                          {/* Subduties */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Subduties</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addSubduty(func.id, duty.id)}
                              >
                                <Plus className="h-3 w-3 mr-2" />
                                Add Subduty
                              </Button>
                            </div>

                            {duty.subduties.map((subduty) => (
                              <div key={subduty.id} className="flex items-start space-x-2 ml-4">
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={subduty.name}
                                    onChange={(e) => updateSubduty(func.id, duty.id, subduty.id, 'name', e.target.value)}
                                    placeholder="Subduty name"
                                    size="sm"
                                  />
                                  <Textarea
                                    value={subduty.description}
                                    onChange={(e) => updateSubduty(func.id, duty.id, subduty.id, 'description', e.target.value)}
                                    placeholder="Subduty description"
                                    rows={1}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeSubduty(func.id, duty.id, subduty.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className={`${isEditing 
              ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800' 
              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
            } text-white font-semibold shadow-lg transition-all duration-200`}
          >
            {isEditing ? (
              <Edit2 className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Update Department' : 'Create Department'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
