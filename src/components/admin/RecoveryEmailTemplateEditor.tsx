'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, ArrowLeft, Edit2, Copy, Check, RotateCcw, Image, Eye, Mail, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEmailTemplatesAction, saveEmailTemplateAction, resetEmailTemplateAction } from '@/lib/actions/email-template-actions';
import { EmailTemplate } from '@/lib/services/email-template-service';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Client-side storage import for image uploads
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Dynamic import for ReactQuill with SSR disabled
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    return RQ;
  }, 
  { 
    ssr: false,
    loading: () => <div className="h-96 w-full bg-muted animate-pulse rounded-md" />
  }
);

// Recovery template IDs we want to show
const RECOVERY_TEMPLATE_IDS = ['cart_recovery_1', 'cart_recovery_2', 'cart_recovery_3'];

// Template display names and descriptions
const TEMPLATE_INFO: Record<string, { title: string; icon: string; description: string }> = {
  'cart_recovery_1': {
    title: 'Email 1: First Reminder',
    icon: '👋',
    description: 'Sent 1 hour after cart abandonment - friendly first reminder'
  },
  'cart_recovery_2': {
    title: 'Email 2: Follow-up',
    icon: '💭',
    description: 'Sent 24 hours after first email - friendly follow-up with benefits'
  },
  'cart_recovery_3': {
    title: 'Email 3: Final Reminder',
    icon: '💙',
    description: 'Sent 72 hours after second email - final friendly reminder'
  }
};

export default function RecoveryEmailTemplateEditor() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Form state
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  
  // Image upload dialog state
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState('400');
  const [showImageDialog, setShowImageDialog] = useState(false);

  // Process HTML to ensure images have proper sizing styles for email
  const processHtmlForEmail = (html: string): string => {
    // Add inline styles to images that have width attributes
    return html.replace(
      /<img([^>]*?)width="(\d+)"([^>]*?)>/gi,
      '<img$1width="$2" style="width: $2px; max-width: 100%; height: auto;"$3>'
    );
  };

  // Handle inserting image with specified width
  const handleInsertImage = () => {
    if (!pendingImageUrl) return;
    
    const width = parseInt(imageWidth) || 400;
    // Use width attribute - we'll process it to add styles when saving/previewing
    const imageTag = `<p><img src="${pendingImageUrl}" alt="Email Image" width="${width}"></p>`;
    setHtmlContent(prev => prev + imageTag);
    
    setShowImageDialog(false);
    setPendingImageUrl(null);
    setImageWidth('400');
    
    toast({ 
      title: 'Image inserted!', 
      description: `Image added with ${width}px width.` 
    });
  };

  // Handle image upload - uploads then shows size dialog
  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !user) return;

      try {
        setUploading(true);
        
        // Generate unique filename
        const fileExtension = file.name.split('.').pop();
        const fileName = `email-images/${uuidv4()}.${fileExtension}`;
        const storageRef = ref(storage, fileName);
        
        // Upload to Firebase Storage
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // Show dialog to set image size before inserting
        setPendingImageUrl(downloadURL);
        setShowImageDialog(true);
        
      } catch (error: any) {
        console.error('Image upload failed:', error);
        toast({ 
          title: 'Upload failed', 
          description: error.message || 'Failed to upload image',
          variant: 'destructive' 
        });
      } finally {
        setUploading(false);
      }
    };
  };

  // Quill modules - standard toolbar
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['link'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['blockquote'],
      ['clean']
    ]
  }), []);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const result = await getEmailTemplatesAction();
    if (result.success && result.templates) {
      // Filter to only show recovery templates
      const recoveryTemplates = result.templates.filter(t => 
        RECOVERY_TEMPLATE_IDS.includes(t.id)
      );
      setTemplates(recoveryTemplates);
    }
    setLoading(false);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setHtmlContent(template.htmlContent);
    setPreviewMode(false);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    if (!subject.trim()) {
      toast({ title: 'Subject required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    
    // Process HTML to add inline styles for images with width attributes
    const processedHtml = processHtmlForEmail(htmlContent);
    
    const updatedTemplate: EmailTemplate = {
      ...selectedTemplate,
      subject,
      htmlContent: processedHtml,
      updatedAt: new Date()
    };

    const result = await saveEmailTemplateAction(updatedTemplate);
    setSaving(false);

    if (result.success) {
      toast({ title: 'Template saved', description: 'Your recovery email template has been updated.' });
      await loadTemplates();
      // Update local state with saved content
      const updated = templates.find(t => t.id === selectedTemplate.id);
      if (updated) {
        setSelectedTemplate({ ...updated, subject, htmlContent: processedHtml });
        setHtmlContent(processedHtml);
      }
    } else {
      toast({ title: 'Error saving template', description: result.error, variant: 'destructive' });
    }
  };

  const handleReset = async (templateId: string) => {
    if (!confirm('Are you sure you want to reset this template to default? This cannot be undone.')) return;

    setLoading(true);
    const result = await resetEmailTemplateAction(templateId);
    if (result.success) {
      toast({ title: 'Template reset', description: 'Template has been reset to default.' });
      await loadTemplates();
      
      // If we were editing this template, reload it
      if (selectedTemplate?.id === templateId) {
        const freshTemplates = await getEmailTemplatesAction();
        if (freshTemplates.success && freshTemplates.templates) {
          const resetTemplate = freshTemplates.templates.find(t => t.id === templateId);
          if (resetTemplate) {
            setSelectedTemplate(resetTemplate);
            setSubject(resetTemplate.subject);
            setHtmlContent(resetTemplate.htmlContent);
          }
        }
      }
    } else {
      toast({ title: 'Error resetting template', description: result.error, variant: 'destructive' });
    }
    setLoading(false);
  };

  const copyVariable = (variable: string) => {
    const text = `{{${variable}}}`;
    navigator.clipboard.writeText(text);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 2000);
    toast({ title: 'Copied to clipboard', description: text });
  };

  // Generate preview with sample data
  const getPreviewHtml = () => {
    // Process HTML for proper image sizing
    let preview = processHtmlForEmail(htmlContent);
    const sampleData: Record<string, string> = {
      firstName: 'John',
      customerName: 'John Doe',
      cartItemsTable: `
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f0f0f0;">
            <td style="padding: 8px; border: 1px solid #ddd;">Sample DTF Transfer - 22x60"</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$45.99</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Custom Gang Sheet - 12x22"</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$22.50</td>
          </tr>
        </table>
      `,
      cartTotal: '68.49',
      recoveryUrl: 'https://example.com/recover/sample-123',
      companyName: 'DTF Wholesale Canada',
      supportEmail: 'orders@dtf-wholesale.ca'
    };
    
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    
    return preview;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Template editing view
  if (selectedTemplate) {
    const templateInfo = TEMPLATE_INFO[selectedTemplate.id] || { 
      title: selectedTemplate.name, 
      icon: '📧', 
      description: selectedTemplate.description 
    };

    return (
      <>
        {/* Image Size Dialog */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Set Image Size</DialogTitle>
              <DialogDescription>
                Choose the width for your image. It will scale proportionally.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {pendingImageUrl && (
                <div className="border rounded-lg p-2 bg-muted/50">
                  <img 
                    src={pendingImageUrl} 
                    alt="Preview" 
                    className="max-h-32 mx-auto object-contain"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Width (pixels)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={imageWidth}
                    onChange={(e) => setImageWidth(e.target.value)}
                    placeholder="400"
                    min="50"
                    max="600"
                  />
                  <span className="text-sm text-muted-foreground self-center">px</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => setImageWidth('200')}>Small (200)</Button>
                  <Button variant="outline" size="sm" onClick={() => setImageWidth('400')}>Medium (400)</Button>
                  <Button variant="outline" size="sm" onClick={() => setImageWidth('560')}>Large (560)</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 400px for logos, 560px for full-width images. Email max width is ~600px.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImageDialog(false)}>Cancel</Button>
              <Button onClick={handleInsertImage}>
                <Image className="h-4 w-4 mr-2" />
                Insert Image
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>{templateInfo.icon}</span>
                {templateInfo.title}
              </h2>
              <p className="text-sm text-muted-foreground">{templateInfo.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleReset(selectedTemplate.id)}
              disabled={loading}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset to Default
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs value={previewMode ? 'preview' : 'edit'} onValueChange={(v) => setPreviewMode(v === 'preview')}>
          <TabsList>
            <TabsTrigger value="edit">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <Label>Email Subject</Label>
                  <Input 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    placeholder="Enter email subject..."
                  />
                  <p className="text-xs text-muted-foreground">
                    You can use variables like {'{{firstName}}'} in the subject
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Email Body</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleImageUpload}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Image className="h-4 w-4 mr-2" />
                      )}
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </div>
                  <div className="bg-white rounded-md text-black border">
                    <ReactQuill 
                      theme="snow" 
                      value={htmlContent} 
                      onChange={setHtmlContent}
                      modules={modules}
                      className="h-[500px]"
                      placeholder="Design your recovery email..."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-16">
                    Click "Upload Image" to add images to your email. Images are stored in the cloud and will appear at the end of your content.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Available Variables</CardTitle>
                    <CardDescription>Click to copy and paste into your email</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedTemplate.variables.map(variable => (
                        <button
                          key={variable}
                          onClick={() => copyVariable(variable)}
                          className="w-full flex items-center justify-between p-2 text-sm bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <code className="text-blue-600 dark:text-blue-400">{'{{' + variable + '}}'}</code>
                          {copiedVar === variable ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} className="text-slate-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>• Use {'{{firstName}}'} to personalize the greeting</p>
                    <p>• {'{{cartItemsTable}}'} shows a formatted list of items</p>
                    <p>• {'{{recoveryUrl}}'} is the cart recovery link</p>
                    <p>• Images can be uploaded directly - click the image icon</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardHeader className="border-b bg-muted/50">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Subject:</p>
                    <p className="font-medium">{subject.replace(/\{\{firstName\}\}/g, 'John')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div 
                  className="bg-white p-6"
                  dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </>
    );
  }

  // Template list view
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Recovery Email Templates</h3>
        <p className="text-sm text-muted-foreground">
          Customize the content of your cart recovery emails. Changes are saved to your account.
        </p>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recovery email templates found.</p>
            <p className="text-sm mt-2">Templates will be created automatically when recovery emails are first enabled.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template, index) => {
            const templateInfo = TEMPLATE_INFO[template.id] || { 
              title: template.name, 
              icon: '📧', 
              description: template.description 
            };
            
            return (
              <Card 
                key={template.id} 
                className="hover:border-blue-500 transition-colors cursor-pointer group"
                onClick={() => handleEdit(template)}
              >
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-2xl">{templateInfo.icon}</span>
                    {templateInfo.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {templateInfo.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    <span className="font-medium">Subject:</span> {template.subject}
                  </div>
                  <Button variant="outline" className="w-full group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Edit2 className="mr-2 h-4 w-4" /> Edit Template
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
