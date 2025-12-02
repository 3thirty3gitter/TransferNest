'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, ArrowLeft, Edit2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEmailTemplatesAction, saveEmailTemplateAction } from '@/lib/actions/email-template-actions';
import { EmailTemplate } from '@/lib/services/email-template-service';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-md" />
});

export default function EmailTemplateManager() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'link'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  }), []);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const result = await getEmailTemplatesAction();
    if (result.success && result.templates) {
      setTemplates(result.templates);
    }
    setLoading(false);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setHtmlContent(template.htmlContent);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    if (!subject.trim()) {
      toast({ title: 'Subject required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const updatedTemplate: EmailTemplate = {
      ...selectedTemplate,
      subject,
      htmlContent,
      updatedAt: new Date()
    };

    const result = await saveEmailTemplateAction(updatedTemplate);
    setSaving(false);

    if (result.success) {
      toast({ title: 'Template saved successfully' });
      await loadTemplates();
      setSelectedTemplate(null);
    } else {
      toast({ title: 'Error saving template', description: result.error, variant: 'destructive' });
    }
  };

  const copyVariable = (variable: string) => {
    const text = `{{${variable}}}`;
    navigator.clipboard.writeText(text);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 2000);
    toast({ title: 'Copied to clipboard', description: text });
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  if (selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Templates
          </Button>
          <h2 className="text-xl font-bold">Edit: {selectedTemplate.name}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <Label>Email Subject</Label>
              <Input 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Enter email subject..."
              />
            </div>

            <div className="space-y-2">
              <Label>Email Body</Label>
              <div className="bg-white rounded-md text-black">
                <ReactQuill 
                  theme="snow" 
                  value={htmlContent} 
                  onChange={setHtmlContent}
                  modules={modules}
                  className="h-96 mb-12"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Variables</CardTitle>
                <CardDescription>Click to copy variables to clipboard</CardDescription>
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
                      {copiedVar === variable ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedTemplate.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map(template => (
        <Card key={template.id} className="hover:border-blue-500 transition-colors cursor-pointer" onClick={() => handleEdit(template)}>
          <CardHeader>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription className="line-clamp-2">{template.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500 mb-4">
              <span className="font-semibold">Subject:</span> {template.subject}
            </div>
            <Button variant="outline" className="w-full">
              <Edit2 className="mr-2 h-4 w-4" /> Edit Template
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
