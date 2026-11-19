import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Upload,
  Download,
  Copy,
  Check,
  FileJson,
  AlertCircle,
} from '@zenner/ui';
import {
  saveCustomTheme,
  getDefaultThemeTemplate,
  ThemeConfig,
} from '@zenner/core/theme/themeConfig';

interface CustomThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeSaved: (newThemeId: string) => void;
}

export function CustomThemeModal({
  isOpen,
  onClose,
  onThemeSaved,
}: CustomThemeModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedTheme, setParsedTheme] = useState<Partial<ThemeConfig> | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse & Validate JSON realtime
  const handleJsonChange = (value: string) => {
    setJsonText(value);
    if (!value.trim()) {
      setErrorMsg(null);
      setParsedTheme(null);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setErrorMsg('JSON data must be an object ({ ... })');
        setParsedTheme(null);
        return;
      }

      if (!parsed.id) {
        setErrorMsg('Missing required "id" field (e.g., "id": "my-theme")');
        setParsedTheme(null);
        return;
      }

      if (parsed.id === 'default') {
        setErrorMsg('Cannot use id "default" because it is reserved for the default theme');
        setParsedTheme(null);
        return;
      }

      setErrorMsg(null);
      setParsedTheme(parsed);
    } catch (err) {
      setErrorMsg('Invalid JSON syntax: ' + (err instanceof Error ? err.message : String(err)));
      setParsedTheme(null);
    }
  };

  // Upload JSON file from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleJsonChange(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Fill with default template
  const handleFillTemplate = () => {
    const template = getDefaultThemeTemplate();
    handleJsonChange(template);
  };

  // Download template file to device
  const handleDownloadTemplate = () => {
    const template = getDefaultThemeTemplate();
    const blob = new Blob([template], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zenner-theme-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy template to clipboard
  const handleCopyTemplate = () => {
    const template = getDefaultThemeTemplate();
    navigator.clipboard.writeText(template);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Save theme
  const handleSave = () => {
    if (!parsedTheme) return;

    const result = saveCustomTheme(parsedTheme);
    if (!result.success || !result.theme) {
      setErrorMsg(result.error || 'An error occurred while saving theme');
      return;
    }

    onThemeSaved(result.theme.id);
    onClose();
    setJsonText('');
    setParsedTheme(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg" className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileJson className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Add Custom Theme (JSON Plugin)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Upload or paste a JSON configuration to customize the entire planner UI.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Helper Toolbar: File upload & Templates */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-y border-border/60">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 gap-1.5 text-xs rounded-lg"
            >
              <Upload className="size-3.5" />
              <span>Upload .json file</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFillTemplate}
              className="h-8 gap-1.5 text-xs rounded-lg text-primary hover:bg-primary/10"
            >
              <span>Fill sample JSON</span>
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyTemplate}
              className="h-8 gap-1 text-[11px] rounded-lg text-muted-foreground hover:text-foreground"
              title="Copy sample JSON"
            >
              {isCopied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              <span>{isCopied ? 'Copied' : 'Copy sample'}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDownloadTemplate}
              className="h-8 gap-1 text-[11px] rounded-lg text-muted-foreground hover:text-foreground"
              title="Download sample JSON"
            >
              <Download className="size-3" />
              <span>Download sample .json</span>
            </Button>
          </div>
        </div>

        {/* JSON input editor */}
        <div className="flex-1 min-h-[220px] flex flex-col gap-2 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Theme JSON configuration:</span>
            {parsedTheme && (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="size-3.5" />
                Valid: {parsedTheme.name || parsedTheme.id} ({parsedTheme.id})
              </span>
            )}
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder={`{\n  "id": "my-ocean-theme",\n  "name": "Ocean Breeze",\n  "plannerWrapper": "...",\n  ...\n}`}
            className="flex-1 w-full min-h-[200px] p-3 rounded-xl border border-border/80 bg-background/70 font-sans text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary shadow-zen-inner resize-y leading-relaxed"
            spellCheck={false}
          />

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={!parsedTheme || Boolean(errorMsg)}
            onClick={handleSave}
            className="rounded-xl px-5"
          >
            Apply & Save Theme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
