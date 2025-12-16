'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Bot, User, Copy, Check, Edit2, Trash2, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolCallDisplay } from './ToolCallDisplay'

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp?: string
  toolCalls?: any
  toolResults?: any
  metadata?: any
  onCopy?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onRegenerate?: () => void
}

function renderInlineMarkdown(text: string, keyPrefix: string = ''): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  
  // Process inline elements: bold, italic, inline code, links
  const inlineRegex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g
  let lastIndex = 0
  let match
  let matchIndex = 0
  
  while ((match = inlineRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(<span key={`${keyPrefix}text-${matchIndex}`}>{text.substring(lastIndex, match.index)}</span>)
    }
    
    const fullMatch = match[0]
    
    if (match[1]) {
      // Inline code: `code`
      parts.push(
        <code key={`${keyPrefix}code-${matchIndex}`} className="bg-admin-bg-primary px-1.5 py-0.5 rounded text-xs font-mono text-admin-text-secondary">
          {fullMatch.slice(1, -1)}
        </code>
      )
    } else if (match[2]) {
      // Bold: **text**
      parts.push(<strong key={`${keyPrefix}bold-${matchIndex}`}>{fullMatch.slice(2, -2)}</strong>)
    } else if (match[3]) {
      // Italic: *text*
      parts.push(<em key={`${keyPrefix}italic-${matchIndex}`}>{fullMatch.slice(1, -1)}</em>)
    } else if (match[4]) {
      // Link: [text](url)
      const linkMatch = fullMatch.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        parts.push(
          <a key={`${keyPrefix}link-${matchIndex}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            {linkMatch[1]}
          </a>
        )
      }
    }
    
    lastIndex = match.index + fullMatch.length
    matchIndex++
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`${keyPrefix}text-end`}>{text.substring(lastIndex)}</span>)
  }
  
  return parts.length > 0 ? parts : [<span key={`${keyPrefix}empty`}>{text}</span>]
}

function renderMarkdown(content: string) {
  const parts: React.ReactNode[] = []
  
  // First, extract code blocks to protect them from other processing
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
  const segments: Array<{ type: 'text' | 'codeBlock'; content: string; lang?: string }> = []
  let lastIndex = 0
  let match
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: content.substring(lastIndex, match.index) })
    }
    segments.push({ type: 'codeBlock', content: match[2], lang: match[1] })
    lastIndex = match.index + match[0].length
  }
  
  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.substring(lastIndex) })
  }
  
  if (segments.length === 0) {
    segments.push({ type: 'text', content })
  }
  
  segments.forEach((segment, segIndex) => {
    if (segment.type === 'codeBlock') {
      parts.push(
        <pre key={`codeblock-${segIndex}`} className="bg-admin-bg-primary p-3 rounded-md overflow-x-auto my-2 text-xs">
          <code>{segment.content}</code>
        </pre>
      )
    } else {
      // Process text line by line
      const lines = segment.content.split('\n')
      
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim()
        const lineKey = `${segIndex}-${lineIndex}`
        
        // Heading 2: ## text
        if (trimmedLine.startsWith('## ')) {
          const headingContent = trimmedLine.substring(3)
          parts.push(
            <h2 key={`h2-${lineKey}`} className="text-lg font-bold mt-4 mb-2 text-admin-text-primary">
              {renderInlineMarkdown(headingContent, `h2-${lineKey}-`)}
            </h2>
          )
        }
        // Heading 3: ### text
        else if (trimmedLine.startsWith('### ')) {
          const headingContent = trimmedLine.substring(4)
          parts.push(
            <h3 key={`h3-${lineKey}`} className="text-base font-semibold mt-3 mb-1 text-admin-text-primary">
              {renderInlineMarkdown(headingContent, `h3-${lineKey}-`)}
            </h3>
          )
        }
        // Heading 1: # text
        else if (trimmedLine.startsWith('# ')) {
          const headingContent = trimmedLine.substring(2)
          parts.push(
            <h1 key={`h1-${lineKey}`} className="text-xl font-bold mt-4 mb-2 text-admin-text-primary">
              {renderInlineMarkdown(headingContent, `h1-${lineKey}-`)}
            </h1>
          )
        }
        // Unordered list: - text or * text
        else if (trimmedLine.match(/^[-*]\s+/)) {
          const listContent = trimmedLine.replace(/^[-*]\s+/, '')
          parts.push(
            <div key={`ul-${lineKey}`} className="flex items-start gap-2 ml-2 my-0.5">
              <span className="text-admin-text-secondary mt-1">•</span>
              <span>{renderInlineMarkdown(listContent, `ul-${lineKey}-`)}</span>
            </div>
          )
        }
        // Ordered list: 1. text
        else if (trimmedLine.match(/^\d+\.\s+/)) {
          const numMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/)
          if (numMatch) {
            parts.push(
              <div key={`ol-${lineKey}`} className="flex items-start gap-2 ml-2 my-0.5">
                <span className="text-admin-text-secondary min-w-[1.5em]">{numMatch[1]}.</span>
                <span>{renderInlineMarkdown(numMatch[2], `ol-${lineKey}-`)}</span>
              </div>
            )
          }
        }
        // Empty line
        else if (trimmedLine === '') {
          parts.push(<div key={`br-${lineKey}`} className="h-2" />)
        }
        // Regular paragraph
        else {
          parts.push(
            <p key={`p-${lineKey}`} className="my-0.5">
              {renderInlineMarkdown(line, `p-${lineKey}-`)}
            </p>
          )
        }
      })
    }
  })
  
  return parts.length > 0 ? parts : <span>{content}</span>
}

export function MessageBubble({ 
  role, 
  content, 
  timestamp,
  toolCalls,
  toolResults,
  metadata,
  onCopy,
  onEdit,
  onDelete,
  onRegenerate
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = role === 'user'
  const isSystem = role === 'system'
  const isTool = role === 'tool'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onCopy?.()
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (isSystem) {
    return null
  }

  const toolCallsData = toolCalls || metadata?.toolCalls
  const toolResultsData = toolResults || metadata?.toolResults

  return (
    <div className={cn(
      'flex gap-3 mb-4 group',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {!isUser && !isTool && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-admin-accent-primary flex items-center justify-center">
          <Bot className="w-4 h-4 text-admin-text-primary" />
        </div>
      )}
      
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-2 relative',
        isUser
          ? 'bg-admin-accent-primary text-admin-text-primary'
          : isTool
          ? 'bg-admin-bg-primary text-admin-text-secondary border border-admin-border-primary'
          : 'bg-admin-bg-secondary text-admin-text-primary'
      )}>
        <div className="text-sm whitespace-pre-wrap">
          {renderMarkdown(content)}
        </div>

        {toolCallsData && (
          <ToolCallDisplay
            toolCalls={Array.isArray(toolCallsData) ? toolCallsData : [toolCallsData]}
            toolResults={toolResultsData}
            className="mt-3"
          />
        )}

        <div className="flex items-center justify-between mt-2">
          {timestamp && (
            <p className="text-xs opacity-70">
              {new Date(timestamp).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
          
          <div className={cn(
            'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
            timestamp ? 'ml-auto' : ''
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopy}
              title="Copiar"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
            
            {isUser && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onEdit}
                title="Editar"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            )}
            
            {!isUser && onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onRegenerate}
                title="Regenerar"
              >
                <RotateCw className="w-3 h-3" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={onDelete}
                title="Eliminar"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-admin-accent-secondary flex items-center justify-center">
          <User className="w-4 h-4 text-admin-text-primary" />
        </div>
      )}
    </div>
  )
}
