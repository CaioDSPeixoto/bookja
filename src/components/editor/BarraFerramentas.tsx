'use client'

import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus
} from 'lucide-react'

interface Props {
  editor: Editor | null
}

function Btn({ ativo, onClick, children, title }: { ativo: boolean; onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded transition-colors ${ativo ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="mx-1 h-5 w-px flex-shrink-0 bg-gray-200" />
}

export default function BarraFerramentas({ editor }: Props) {
  if (!editor) return null

  return (
    <div className="flex h-10 items-center gap-0.5 overflow-x-auto border-b border-gray-200 bg-gray-50/80 px-3">
      <Btn ativo={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito">
        <Bold size={16} />
      </Btn>
      <Btn ativo={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico">
        <Italic size={16} />
      </Btn>
      <Btn ativo={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado">
        <Underline size={16} />
      </Btn>
      <Sep />
      <Btn ativo={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1">
        <Heading1 size={16} />
      </Btn>
      <Btn ativo={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2">
        <Heading2 size={16} />
      </Btn>
      <Btn ativo={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3">
        <Heading3 size={16} />
      </Btn>
      <Sep />
      <Btn ativo={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
        <List size={16} />
      </Btn>
      <Btn ativo={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
        <ListOrdered size={16} />
      </Btn>
      <Sep />
      <Btn ativo={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citação">
        <Quote size={16} />
      </Btn>
      <Btn ativo={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separador">
        <Minus size={16} />
      </Btn>
    </div>
  )
}
