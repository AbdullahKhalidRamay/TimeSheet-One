import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Calendar, Save, X } from "lucide-react";
import { TimeEntry } from "@/validation/index";
import { saveTimeEntry, deleteTimeEntry } from "@/services/storage";

interface EditSingleTimeEntryFormProps {
  entry: TimeEntry;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSingleTimeEntryForm({ entry, onClose, onSuccess }: EditSingleTimeEntryFormProps) {
  const [formData, setFormData] = useState({
    date: entry.date,
    actualHours: entry.actualHours,
    billableHours: entry.billableHours,
    availableHours: entry.availableHours || 0,
    task: entry.task,
    isBillable: entry.isBillable,
    projectDetails: {
      category: entry.projectDetails.category,
      name: entry.projectDetails.name,
      level: entry.projectDetails.level || "",
      task: entry.projectDetails.task || "",
      subtask: entry.projectDetails.subtask || "",
      description: entry.projectDetails.description || ""
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProjectDetailsChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      projectDetails: {
        ...prev.projectDetails,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Delete the original entry
      deleteTimeEntry(entry.id);

      // Create updated entry
      const updatedEntry: TimeEntry = {
        ...entry,
        date: formData.date,
        actualHours: formData.actualHours,
        billableHours: formData.billableHours,
        totalHours: formData.actualHours + formData.billableHours,
        availableHours: formData.availableHours,
        task: formData.task,
        isBillable: formData.isBillable,
        projectDetails: formData.projectDetails,
        updatedAt: new Date().toISOString()
      };

      saveTimeEntry(updatedEntry);
      onSuccess();
    } catch (error) {
      console.error('Error updating time entry:', error);
      alert('Error updating time entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'project': return 'bg-blue-500';
      case 'product': return 'bg-purple-500';
      case 'department': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'project': return 'default';
      case 'product': return 'secondary';
      case 'department': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card border-border shadow-lg max-h-[90vh] overflow-y-auto">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="flex items-center justify-between text-xl font-semibold">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-foreground/20 rounded-lg">
              <Calendar className="h-6 w-6" />
            </div>
            <span>Edit Time Entry</span>
          </div>
          <button 
            onClick={onClose}
            className="text-primary-foreground/80 hover:text-primary-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Project Info Header */}
        <div className="p-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${getCategoryColor(formData.projectDetails.category)}`}></div>
            <h3 className="font-semibold text-base">{formData.projectDetails.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {formData.projectDetails.category} - {formData.projectDetails.task}
          </p>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <DatePicker
            date={formData.date ? new Date(formData.date) : undefined}
            onDateChange={(date) => 
              handleInputChange('date', date ? date.toISOString().split('T')[0] : '')
            }
            placeholder="Select date"
            className="w-full max-w-xs"
          />
        </div>

        {/* Hours Section */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="actualHours">Actual Hours</Label>
            <Input
              id="actualHours"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={formData.actualHours}
              onChange={(e) => handleInputChange('actualHours', parseFloat(e.target.value) || 0)}
              placeholder="Enter actual hours"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="billableHours">Billable Hours</Label>
            <Input
              id="billableHours"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={formData.billableHours}
              onChange={(e) => handleInputChange('billableHours', parseFloat(e.target.value) || 0)}
              placeholder="Enter billable hours"
              disabled={!formData.isBillable}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availableHours">Available Hours</Label>
            <Input
              id="availableHours"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={formData.availableHours}
              onChange={(e) => handleInputChange('availableHours', parseFloat(e.target.value) || 0)}
              placeholder="Available hours"
              className="bg-muted/50 font-semibold"
            />
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground">Project Details</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="level">Level/Stage/Function</Label>
              <Input
                id="level"
                value={formData.projectDetails.level}
                onChange={(e) => handleProjectDetailsChange('level', e.target.value)}
                placeholder="Enter level, stage, or function"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectTask">Task/Duty</Label>
              <Input
                id="projectTask"
                value={formData.projectDetails.task}
                onChange={(e) => handleProjectDetailsChange('task', e.target.value)}
                placeholder="Enter task or duty"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtask">Subtask</Label>
            <Input
              id="subtask"
              value={formData.projectDetails.subtask}
              onChange={(e) => handleProjectDetailsChange('subtask', e.target.value)}
              placeholder="Enter subtask (optional)"
            />
          </div>
        </div>

        {/* Task Description */}
        <div className="space-y-2">
          <Label htmlFor="task">Task Description</Label>
          <Textarea
            id="task"
            placeholder="What did you work on?"
            value={formData.task}
            onChange={(e) => handleInputChange('task', e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Billable Toggle */}
        <div className="flex items-center space-x-3">
          <Switch
            checked={formData.isBillable}
            onCheckedChange={(checked) => {
              handleInputChange('isBillable', checked);
              if (!checked) {
                handleInputChange('billableHours', 0);
              }
            }}
          />
          <Label className="text-sm font-medium">
            💰 Billable Work
          </Label>
        </div>

        {/* Summary */}
        <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium">Total Hours</p>
              <p className="text-lg font-bold text-gray-800">
                {(formData.actualHours + formData.billableHours).toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium">Billable</p>
              <p className="text-lg font-bold text-green-700">
                {formData.billableHours.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-border">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isLoading || formData.actualHours + formData.billableHours === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
