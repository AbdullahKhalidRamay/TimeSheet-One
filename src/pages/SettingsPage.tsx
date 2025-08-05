import React from 'react';
import { useSettings, MIN_FONT_SIZE, MAX_FONT_SIZE } from '@/contexts/SettingsContext';
import { useTheme } from '@/components/ThemeProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Monitor, Palette, Type } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { fontSize, setFontSize } = useSettings();
  const { theme, setTheme } = useTheme();

  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value[0]);
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const getFontSizeLabel = (size: number) => {
    if (size <= 14) return 'Small';
    if (size <= 16) return 'Medium';
    if (size <= 18) return 'Large';
    return 'Extra Large';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="space-y-6">
        <div>
          <h1 className="text-heading mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your application appearance and preferences.</p>
        </div>

        <Separator />

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Choose how the application looks and feels.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Theme</Label>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={theme === option.value ? 'default' : 'outline'}
                      onClick={() => setTheme(option.value as any)}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm">{option.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Font Size Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Font Size
            </CardTitle>
            <CardDescription>
              Adjust the font size throughout the application for better readability.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Size</Label>
                <span className="text-sm text-muted-foreground">
                  {getFontSizeLabel(fontSize)} ({fontSize}px)
                </span>
              </div>
              
              <div className="px-2">
                <Slider
                  value={[fontSize]}
                  onValueChange={handleFontSizeChange}
                  max={MAX_FONT_SIZE}
                  min={MIN_FONT_SIZE}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Small ({MIN_FONT_SIZE}px)</span>
                <span>Extra Large ({MAX_FONT_SIZE}px)</span>
              </div>
            </div>

            {/* Preview Text */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                <p className="text-heading">This is a heading</p>
                <p className="text-body">This is regular body text that shows how your content will appear with the selected font size.</p>
                <p className="text-caption">This is caption text for smaller details.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;

