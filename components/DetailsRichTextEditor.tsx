'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { toEditorHtml } from '@/lib/editor-html';
import { Button } from '@/components/ui/button';

interface DetailsRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DetailsRichTextEditor({ value, onChange }: DetailsRichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: 'https',
      }),
    ],
    content: toEditorHtml(value),
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  const setLink = () => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', previousUrl || 'https://');

    if (url === null) {
      return;
    }

    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  };

  useEffect(() => {
    if (!editor) {
      return;
    }

    const normalized = toEditorHtml(value);
    if (editor.getHTML() !== normalized) {
      editor.commands.setContent(normalized, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className="rounded-md border border-gray-300 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 p-2">
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          Bold
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          Italic
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          Bullets
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          Numbered
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => editor?.chain().focus().setParagraph().run()}
        >
          Paragraph
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={setLink}
        >
          Link
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => editor?.chain().focus().extendMarkRange('link').unsetLink().run()}
        >
          Unlink
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          Clear
        </Button>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none min-h-40 w-full px-3 py-2 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2"
      />
    </div>
  );
}
