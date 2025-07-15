import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Heading1,
    Heading2,
    Heading3,
    Highlighter,
    Italic,
    Link,
    List,
    ListOrdered,
    Sparkles,
    Strikethrough,
} from "lucide-react";
import { Toggle } from "../ui/toggle";
import { Editor } from "@tiptap/react";
import { useCallback, useState } from "react";
import { Button } from "../ui/button";

export default function MenuBar({ editor }: { editor: Editor | null }) {
    const [rephraseLoading, setRephraseLoading] = useState(false);

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        // update link
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    const handleRephrase = async () => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, " ");

        if (!selectedText) {
            // NOTE: Using a custom modal or toast notification would be better than alert().
            alert("Please select text to rephrase.");
            return;
        }

        setRephraseLoading(true);
        try {
            const response = await fetch('/api/rephrase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: selectedText }),
            });

            if (!response.ok) {
                throw new Error('Failed to get rephrased text from the server.');
            }

            const { rephrasedText } = await response.json();
            editor.chain().focus().deleteRange({ from, to }).insertContent(rephrasedText).run();

        } catch (error) {
            console.error(error);
            alert("An error occurred while rephrasing. Please check the console.");
        } finally {
            setRephraseLoading(false);
        }
    };

    if (!editor) {
        return null;
    }

    const applyHeading = (level: 1 | 2 | 3) => {
        if (!editor) return;
        if (editor.state.selection.empty) {
            editor.chain().focus().toggleHeading({ level }).run();
            return;
        }
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText.trim() === "") return;
        editor.chain().focus().insertContent(`<h${level}>${selectedText}</h${level}>`).run();
    };

    const menuOptions = [
        { type: "button", icon: <Sparkles className="h-4 w-4" />, onClick: handleRephrase, pressed: false, disabled: rephraseLoading, title: "Rephrase/Polish with AI" },
        { type: "toggle", icon: <Bold className="h-4 w-4" />, onClick: () => editor.chain().focus().toggleBold().run(), pressed: editor.isActive("bold"), title: "Bold" },
        { type: "toggle", icon: <Italic className="h-4 w-4" />, onClick: () => editor.chain().focus().toggleItalic().run(), pressed: editor.isActive("italic"), title: "Italic" },
        { type: "toggle", icon: <Strikethrough className="h-4 w-4" />, onClick: () => editor.chain().focus().toggleStrike().run(), pressed: editor.isActive("strike"), title: "Strikethrough" },
        { type: "button", icon: <Link className="h-4 w-4" />, onClick: setLink, pressed: editor.isActive("link"), title: "Set Link" },
        { type: "toggle", icon: <Heading1 className="h-4 w-4" />, onClick: () => applyHeading(1), pressed: editor.isActive("heading", { level: 1 }), title: "Heading 1" },
        { type: "toggle", icon: <Heading2 className="h-4 w-4" />, onClick: () => applyHeading(2), pressed: editor.isActive("heading", { level: 2 }), title: "Heading 2" },
        { type: "toggle", icon: <Heading3 className="h-4 w-4" />, onClick: () => applyHeading(3), pressed: editor.isActive("heading", { level: 3 }), title: "Heading 3" },
        { type: "toggle", icon: <List className="h-4 w-4" />, onClick: () => editor.chain().focus().toggleBulletList().run(), pressed: editor.isActive("bulletList"), title: "Bullet List" },
        { type: "toggle", icon: <ListOrdered className="h-4 w-4" />, onClick: () => editor.chain().focus().toggleOrderedList().run(), pressed: editor.isActive("orderedList"), title: "Ordered List" },
        { type: "toggle", icon: <Highlighter className="h-4 w-4" />, onClick: () => editor.chain().focus().toggleHighlight().run(), pressed: editor.isActive("highlight"), title: "Highlight" },
        { type: "toggle", icon: <AlignLeft className="h-4 w-4" />, onClick: () => editor.chain().focus().setTextAlign("left").run(), pressed: editor.isActive({ textAlign: "left" }), title: "Align Left" },
        { type: "toggle", icon: <AlignCenter className="h-4 w-4" />, onClick: () => editor.chain().focus().setTextAlign("center").run(), pressed: editor.isActive({ textAlign: "center" }), title: "Align Center" },
        { type: "toggle", icon: <AlignRight className="h-4 w-4" />, onClick: () => editor.chain().focus().setTextAlign("right").run(), pressed: editor.isActive({ textAlign: "right" }), title: "Align Right" },
        { type: "toggle", icon: <AlignJustify className="h-4 w-4" />, onClick: () => editor.chain().focus().setTextAlign("justify").run(), pressed: editor.isActive({ textAlign: "justify" }), title: "Justify" },
    ];

    return (
        <div className="border rounded-md p-1 mb-1 bg-slate-50 flex flex-wrap items-center gap-1 z-50">
            {menuOptions.map((option, index) =>
                option.type === "toggle" ? (
                    <Toggle
                        key={index}
                        size="sm"
                        pressed={option.pressed}
                        onPressedChange={option.onClick}
                        title={option.title}
                    >
                        {option.icon}
                    </Toggle>
                ) : (
                    <Button
                        key={index}
                        variant="ghost"
                        size="icon"
                        onClick={option.onClick}
                        disabled={option.disabled}
                        className={`h-8 w-8 ${option.pressed ? 'is-active bg-gray-200' : ''}`}
                        title={option.title}
                    >
                        {rephraseLoading && option.title?.includes("Rephrase") ? "..." : option.icon}
                    </Button>
                )
            )}
        </div>
    );
}
