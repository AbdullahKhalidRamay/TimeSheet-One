import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { saveProduct, generateId } from "@/utils/storage";
import { getCurrentUser } from "@/utils/auth";
import { Product, ProductStage, ProductTask, ProductSubtask } from "@/types";

interface CreateProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProductForm({ isOpen, onClose, onSuccess }: CreateProductFormProps) {
  const [productName, setProductName] = useState("");
  const [isBillable, setIsBillable] = useState(false);
  const [stages, setStages] = useState<ProductStage[]>([
    {
      id: generateId(),
      name: "",
      tasks: []
    }
  ]);

  const currentUser = getCurrentUser();

  const addStage = () => {
    setStages([...stages, {
      id: generateId(),
      name: "",
      tasks: []
    }]);
  };

  const removeStage = (stageId: string) => {
    setStages(stages.filter(stage => stage.id !== stageId));
  };

  const updateStage = (stageId: string, name: string) => {
    setStages(stages.map(stage => 
      stage.id === stageId ? { ...stage, name } : stage
    ));
  };

  const addTask = (stageId: string) => {
    setStages(stages.map(stage => 
      stage.id === stageId ? {
        ...stage,
        tasks: [...stage.tasks, {
          id: generateId(),
          name: "",
          description: "",
          subtasks: []
        }]
      } : stage
    ));
  };

  const removeTask = (stageId: string, taskId: string) => {
    setStages(stages.map(stage => 
      stage.id === stageId ? {
        ...stage,
        tasks: stage.tasks.filter(task => task.id !== taskId)
      } : stage
    ));
  };

  const updateTask = (stageId: string, taskId: string, field: keyof ProductTask, value: string) => {
    setStages(stages.map(stage => 
      stage.id === stageId ? {
        ...stage,
        tasks: stage.tasks.map(task => 
          task.id === taskId ? { ...task, [field]: value } : task
        )
      } : stage
    ));
  };

  const addSubtask = (stageId: string, taskId: string) => {
    setStages(stages.map(stage => 
      stage.id === stageId ? {
        ...stage,
        tasks: stage.tasks.map(task => 
          task.id === taskId ? {
            ...task,
            subtasks: [...task.subtasks, {
              id: generateId(),
              name: "",
              description: ""
            }]
          } : task
        )
      } : stage
    ));
  };

  const removeSubtask = (stageId: string, taskId: string, subtaskId: string) => {
    setStages(stages.map(stage => 
      stage.id === stageId ? {
        ...stage,
        tasks: stage.tasks.map(task => 
          task.id === taskId ? {
            ...task,
            subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId)
          } : task
        )
      } : stage
    ));
  };

  const updateSubtask = (stageId: string, taskId: string, subtaskId: string, field: keyof ProductSubtask, value: string) => {
    setStages(stages.map(stage => 
      stage.id === stageId ? {
        ...stage,
        tasks: stage.tasks.map(task => 
          task.id === taskId ? {
            ...task,
            subtasks: task.subtasks.map(subtask => 
              subtask.id === subtaskId ? { ...subtask, [field]: value } : subtask
            )
          } : task
        )
      } : stage
    ));
  };

  const handleSubmit = () => {
    if (!productName.trim()) {
      alert("Please enter a product name");
      return;
    }

    const product: Product = {
      id: generateId(),
      name: productName,
      stages: stages.filter(stage => stage.name.trim()),
      isBillable,
      createdBy: currentUser?.name || "Unknown",
      createdAt: new Date().toISOString()
    };

    saveProduct(product);
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setProductName("");
    setIsBillable(false);
    setStages([{
      id: generateId(),
      name: "",
      tasks: []
    }]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name"
            />
          </div>

          {/* Billable Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isBillable"
              checked={isBillable}
              onCheckedChange={(checked) => setIsBillable(checked as boolean)}
            />
            <Label htmlFor="isBillable">This product is billable</Label>
          </div>

          {/* Product Stages */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Product Stages</Label>
              <Button type="button" onClick={addStage} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Stage
              </Button>
            </div>

            {stages.map((stage, stageIndex) => (
              <Card key={stage.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={stage.name}
                      onChange={(e) => updateStage(stage.id, e.target.value)}
                      placeholder="Stage name"
                      className="flex-1"
                    />
                    {stages.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeStage(stage.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Tasks</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTask(stage.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    </div>

                    {stage.tasks.map((task) => (
                      <Card key={task.id} className="p-3 ml-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Input
                              value={task.name}
                              onChange={(e) => updateTask(stage.id, task.id, 'name', e.target.value)}
                              placeholder="Task name"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeTask(stage.id, task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={task.description}
                            onChange={(e) => updateTask(stage.id, task.id, 'description', e.target.value)}
                            placeholder="Task description"
                            rows={2}
                          />

                          {/* Subtasks */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Subtasks</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addSubtask(stage.id, task.id)}
                              >
                                <Plus className="h-3 w-3 mr-2" />
                                Add Subtask
                              </Button>
                            </div>

                            {task.subtasks.map((subtask) => (
                              <div key={subtask.id} className="flex items-start space-x-2 ml-4">
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={subtask.name}
                                    onChange={(e) => updateSubtask(stage.id, task.id, subtask.id, 'name', e.target.value)}
                                    placeholder="Subtask name"
                                    size="sm"
                                  />
                                  <Textarea
                                    value={subtask.description}
                                    onChange={(e) => updateSubtask(stage.id, task.id, subtask.id, 'description', e.target.value)}
                                    placeholder="Subtask description"
                                    rows={1}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeSubtask(stage.id, task.id, subtask.id)}
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
          <Button onClick={handleSubmit}>
            Create Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
