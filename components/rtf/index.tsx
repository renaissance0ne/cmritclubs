"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";
import MenuBar from "./menu-bar";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    // 👇 Add this line to prevent the SSR hydration error
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        // FIX: Explicitly configure heading levels to ensure they are enabled.
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-4",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-4",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-700 underline',
        },
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl min-h-[250px] w-full border rounded-md bg-white py-2 px-3 text-black focus:outline-none ${className}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="flex flex-col">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
