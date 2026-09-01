import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { Note } from '../types/api.types';

/**
 * Converts rich-text / HTML note content into clean structured plain text,
 * preserving headings, lists, quotes, paragraphs, and dividers.
 */
export const htmlToPlainText = (html: string): string => {
  if (!html) return '';
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    let childrenText = '';
    el.childNodes.forEach((child) => {
      childrenText += processNode(child);
    });

    switch (tag) {
      case 'h1':
        return `\n\n${childrenText.trim()}\n========================================\n\n`;
      case 'h2':
        return `\n\n${childrenText.trim()}\n----------------------------------------\n\n`;
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return `\n\n### ${childrenText.trim()}\n\n`;
      case 'p':
        return `\n\n${childrenText.trim()}\n\n`;
      case 'br':
        return '\n';
      case 'hr':
        return '\n\n----------------------------------------\n\n';
      case 'li': {
        const parentTag = el.parentElement?.tagName.toLowerCase();
        if (parentTag === 'ol') {
          const index = Array.from(el.parentElement?.children || []).indexOf(el) + 1;
          return `\n  ${index}. ${childrenText.trim()}`;
        }
        return `\n  • ${childrenText.trim()}`;
      }
      case 'ul':
      case 'ol':
        return `\n${childrenText.trim()}\n\n`;
      case 'blockquote':
        return `\n\n> ${childrenText.trim().replace(/\n/g, '\n> ')}\n\n`;
      default:
        return childrenText;
    }
  };

  const raw = processNode(doc.body);
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Generates a structured plain text export string for a single note.
 */
export const formatSingleNoteText = (note: Note): string => {
  const title = note.title || 'Untitled Note';
  const date = note.createdAt || note.updatedAt ? format(new Date(note.createdAt || note.updatedAt), 'PPpp') : 'Recently';
  const tags = (note.tags || []).join(', ') || 'General';
  const cleanBody = htmlToPlainText(note.content || note.body || '');

  return [
    '========================================',
    title.toUpperCase(),
    `Tags: ${tags}  |  Updated: ${date}`,
    '========================================',
    '',
    cleanBody,
    '',
    '========================================',
  ].join('\n');
};

/**
 * Formats a list of notes for workspace batch export.
 */
export const formatMultipleNotesText = (notes: Note[]): string => {
  return notes.map(formatSingleNoteText).join('\n\n\n');
};

/**
 * Renders a note with structured typographic hierarchy into a jsPDF document.
 */
export const renderNoteToPdf = (doc: jsPDF, note: Note, isBatch: boolean = false): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let yOffset = isBatch && doc.getCurrentPageInfo().pageNumber > 1 ? 25 : 20;

  const renderWrappedText = (
    lines: string[],
    lineHeight: number,
    xOffset: number = margin,
    spacingAfter: number = 3,
  ): void => {
    for (const line of lines) {
      if (yOffset + lineHeight > pageHeight - margin) {
        doc.addPage();
        yOffset = 20;
      }
      doc.text(line, xOffset, yOffset);
      yOffset += lineHeight;
    }
    yOffset += spacingAfter;
  };

  if (yOffset + 24 > pageHeight - margin) {
    doc.addPage();
    yOffset = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(note.title || 'Untitled Note', contentWidth);
  renderWrappedText(titleLines, 8, margin, 2);

  if (yOffset + 12 > pageHeight - margin) {
    doc.addPage();
    yOffset = 20;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  const tagsStr = (note.tags || []).join(', ') || 'General';
  const dateStr = note.createdAt || note.updatedAt ? format(new Date(note.createdAt || note.updatedAt), 'PPpp') : 'Recently';
  doc.text(`Tags: ${tagsStr}  |  Updated: ${dateStr}`, margin, yOffset);
  yOffset += 6;

  if (yOffset + 10 > pageHeight - margin) {
    doc.addPage();
    yOffset = 20;
  }
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, yOffset, pageWidth - margin, yOffset);
  yOffset += 10;

  const rawHtml = note.content || note.body || '';
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(rawHtml, 'text/html');
  const elements = Array.from(parsedDoc.body.children);

  if (!elements.length) {
    const plainLines = rawHtml.split(/\r?\n/);
    plainLines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        yOffset += 4;
        return;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      const wrapped = doc.splitTextToSize(trimmed, contentWidth);
      renderWrappedText(wrapped, 5, margin, 3);
    });
    return;
  }

  elements.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const text = el.textContent?.trim() || '';
    if (!text && tag !== 'hr') return;

    if (tag === 'h1') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(20, 20, 20);
      const lines = doc.splitTextToSize(text, contentWidth);
      renderWrappedText(lines, 6, margin, 4);
    } else if (tag === 'h2') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(text, contentWidth);
      renderWrappedText(lines, 5.5, margin, 3);
    } else if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(text, contentWidth);
      renderWrappedText(lines, 5, margin, 2);
    } else if (tag === 'hr') {
      if (yOffset + 8 > pageHeight - margin) {
        doc.addPage();
        yOffset = 20;
      }
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yOffset, pageWidth - margin, yOffset);
      yOffset += 6;
    } else if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(el.children);
      items.forEach((item, idx) => {
        const itemText = item.textContent?.trim() || '';
        if (!itemText) return;
        const prefix = tag === 'ol' ? `${idx + 1}. ` : '•  ';
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        const wrapped = doc.splitTextToSize(`${prefix}${itemText}`, contentWidth - 6);
        renderWrappedText(wrapped, 5, margin + 4, 2);
      });
      yOffset += 3;
    } else if (tag === 'blockquote') {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const wrapped = doc.splitTextToSize(text, contentWidth - 10);
      for (const line of wrapped) {
        if (yOffset + 5 > pageHeight - margin) {
          doc.addPage();
          yOffset = 20;
        }
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(1.5);
        doc.line(margin, yOffset - 1, margin, yOffset + 4);
        doc.text(line, margin + 6, yOffset);
        yOffset += 5;
      }
      yOffset += 5;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      const wrapped = doc.splitTextToSize(text, contentWidth);
      renderWrappedText(wrapped, 5, margin, 3);
    }
  });
};
