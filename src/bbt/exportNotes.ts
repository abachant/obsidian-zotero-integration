import { App, Editor, Notice, htmlToMarkdown } from 'obsidian';

import { Database } from '../types';
import { getCiteKeys } from './cayw';
import { getNotesFromCiteKeys } from './jsonRPC';

export async function noteExportPrompt(database: Database) {
  const citeKeys = await getCiteKeys(database);

  if (!citeKeys.length) return;

  const notes = await getNotesFromCiteKeys(citeKeys, database);

  if (!notes) {
    new Notice('No notes found for selected items', 7000);
    return;
  }

  const keys = Object.keys(notes);

  if (!keys.length) {
    new Notice('No notes found for selected items', 7000);
    return;
  }

  const notesMarkdown: Record<string, string> = {};

  keys.forEach((key) => {
    notesMarkdown[key] = notes[key]
      .map((n: string) => htmlToMarkdown(n))
      .join('\n\n');
  });

  return notesMarkdown;
}

export function insertNotesIntoCurrentDoc(
  editor: Editor,
  notes: Record<string, string>
) {
  editor.replaceSelection(Object.values(notes).join('\n\n'));
}

export async function filesFromNotes(
  app: App,
  folder: string,
  notes: Record<string, string>
) {
  const keys = Object.keys(notes);

  for (let i = 0, len = keys.length; i < len; i++) {
    if (!(await newFile(app, folder, keys[i], notes[keys[i]]))) {
      break;
    }
  }
}

export async function newFile(
  app: App,
  folder: string,
  citeKey: string,
  content: string
) {
  const target = folder.replace(/(?:^\/|\/$)/g, '');

  if (!app.vault.getAbstractFileByPath(target)) {
    try {
      await app.vault.createFolder(target);
    } catch (e) {
      console.error(e);
      new Notice(`Error creating folder "${target}": ${e.message}`, 10000);
    }
  }

  try {
    return await app.vault.create(`${target}/${citeKey}.md`, content);
  } catch (e) {
    console.error(e);
    new Notice(
      `Error creating file "${target}${citeKey}.md": ${e.message}`,
      10000
    );
    return null;
  }
}
