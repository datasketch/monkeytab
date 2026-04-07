/**
 * Sample data generator for the memory adapter
 */

import type {
  BaseSpec,
  TableSpec,
  FieldSpec,
  Row,
  SingleSelectFieldOptions,
  MultiSelectFieldOptions,
  Attachment,
  AttachmentFieldOptions,
  ImageFieldOptions,
  TextFieldOptions,
} from '@monkeytab/core';

// =============================================================================
// Field Definitions
// =============================================================================

const contactsFields: FieldSpec[] = [
  { id: 'name', label: 'Name', type: 'Text' },
  { id: 'email', label: 'Email', type: 'Text' },
  { id: 'company', label: 'Company', type: 'Text' },
  {
    id: 'status',
    label: 'Status',
    type: 'SingleSelect',
    options: {
      options: [
        { value: 'lead', label: 'Lead', color: '#fbbf24' },
        { value: 'customer', label: 'Customer', color: '#22c55e' },
        { value: 'churned', label: 'Churned', color: '#ef4444' },
      ],
    } as SingleSelectFieldOptions,
  },
  {
    id: 'tags',
    label: 'Tags',
    type: 'MultiSelect',
    options: {
      options: [
        { value: 'vip', label: 'VIP', color: '#8b5cf6' },
        { value: 'newsletter', label: 'Newsletter', color: '#3b82f6' },
        { value: 'partner', label: 'Partner', color: '#10b981' },
        { value: 'enterprise', label: 'Enterprise', color: '#f59e0b' },
        { value: 'referral', label: 'Referral', color: '#ec4899' },
      ],
    } as MultiSelectFieldOptions,
  },
  { id: 'value', label: 'Deal Value', type: 'Number' },
  { id: 'created', label: 'Created', type: 'Date' },
  {
    id: 'photo',
    label: 'Photo',
    type: 'Image',
    options: {
      maxImages: 1,
      displaySize: 'medium',
    } as ImageFieldOptions,
  },
];

const tasksFields: FieldSpec[] = [
  { id: 'title', label: 'Title', type: 'Text' },
  {
    id: 'description',
    label: 'Description',
    type: 'Text',
    options: {
      multiline: true,
      richText: true,
    } as TextFieldOptions,
  },
  {
    id: 'priority',
    label: 'Priority',
    type: 'SingleSelect',
    options: {
      options: [
        { value: 'low', label: 'Low', color: '#94a3b8' },
        { value: 'medium', label: 'Medium', color: '#fbbf24' },
        { value: 'high', label: 'High', color: '#ef4444' },
      ],
    } as SingleSelectFieldOptions,
  },
  {
    id: 'status',
    label: 'Status',
    type: 'SingleSelect',
    options: {
      options: [
        { value: 'todo', label: 'To Do', color: '#94a3b8' },
        { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
        { value: 'done', label: 'Done', color: '#22c55e' },
      ],
    } as SingleSelectFieldOptions,
  },
  {
    id: 'labels',
    label: 'Labels',
    type: 'MultiSelect',
    options: {
      options: [
        { value: 'bug', label: 'Bug', color: '#ef4444' },
        { value: 'feature', label: 'Feature', color: '#22c55e' },
        { value: 'docs', label: 'Docs', color: '#3b82f6' },
        { value: 'urgent', label: 'Urgent', color: '#f97316' },
        { value: 'blocked', label: 'Blocked', color: '#6b7280' },
      ],
    } as MultiSelectFieldOptions,
  },
  { id: 'due_date', label: 'Due Date', type: 'Date' },
  { id: 'completed', label: 'Completed', type: 'Boolean' },
  {
    id: 'attachments',
    label: 'Attachments',
    type: 'Attachment',
    options: {
      maxFiles: 5,
    } as AttachmentFieldOptions,
  },
];

// =============================================================================
// Sample Data Generation
// =============================================================================

const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const companies = ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Stark Industries', 'Wayne Enterprises', 'Cyberdyne', 'Weyland', 'Tyrell', 'Massive Dynamic'];
const statuses = ['lead', 'customer', 'churned'];
const tagOptions = ['vip', 'newsletter', 'partner', 'enterprise', 'referral'];

function generatePhotoAttachment(index: number): Attachment | null {
  if (index % 5 === 0) return null;

  const id = `photo-${index}`;
  return {
    id,
    filename: `profile-${index}.jpg`,
    url: `https://picsum.photos/seed/${index}/200/200`,
    mimeType: 'image/jpeg',
    size: 15000 + (index * 100),
    thumbnailUrl: `https://picsum.photos/seed/${index}/100/100`,
  };
}

function generateContacts(count: number): Row[] {
  const baseDate = new Date('2024-01-01T00:00:00Z');
  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const company = companies[i % companies.length];
    const status = statuses[i % statuses.length];
    const value = Math.floor(Math.random() * 50000) + 1000;
    const day = (i % 28) + 1;
    const month = Math.floor(i / 28) % 12;
    const created = new Date(2024, month, day).toISOString().split('T')[0];

    const numTags = i % 4;
    const tags: string[] = [];
    for (let t = 0; t < numTags; t++) {
      const tag = tagOptions[(i + t) % tagOptions.length];
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }

    const photo = generatePhotoAttachment(i + 1);

    const timestamp = new Date(baseDate.getTime() + i * 3600000).toISOString();

    return {
      id: `contact-${i + 1}`,
      fields: {
        name,
        email,
        company,
        status,
        tags: tags.length > 0 ? tags : null,
        value,
        created,
        photo: photo ? [photo] : null,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
}

const taskTitles = [
  'Review project proposal',
  'Update documentation',
  'Fix login bug',
  'Design new feature',
  'Write tests',
  'Code review',
  'Deploy to staging',
  'Customer meeting',
  'Sprint planning',
  'Refactor database layer',
];

const labelOptions = ['bug', 'feature', 'docs', 'urgent', 'blocked'];

const attachmentFiles = [
  { name: 'requirements.pdf', mimeType: 'application/pdf', size: 125000 },
  { name: 'design-mockup.png', mimeType: 'image/png', size: 450000 },
  { name: 'meeting-notes.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 35000 },
  { name: 'budget.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 28000 },
  { name: 'screenshot.jpg', mimeType: 'image/jpeg', size: 180000 },
];

function generateTaskAttachments(index: number): Attachment[] | null {
  if (index % 5 < 2) return null;

  const numAttachments = (index % 3) + 1;
  const attachments: Attachment[] = [];

  for (let a = 0; a < numAttachments; a++) {
    const fileInfo = attachmentFiles[(index + a) % attachmentFiles.length];
    const id = `attachment-${index}-${a}`;
    attachments.push({
      id,
      filename: fileInfo.name,
      url: `/api/files/${id}`,
      mimeType: fileInfo.mimeType,
      size: fileInfo.size,
      thumbnailUrl: fileInfo.mimeType.startsWith('image/') ? `/api/files/${id}/thumbnail` : undefined,
    });
  }

  return attachments;
}

const markdownDescriptions = [
  'This task is **urgent** and needs to be completed _as soon as possible_.\n\nSteps:\n1. Review the requirements\n2. Implement the solution\n3. Test thoroughly',
  'A simple task with `inline code` and a [link to docs](https://example.com).\n\nNote: ~~This was originally lower priority~~',
  '**Summary**: Update all dependencies\n\n*Details*: Check for breaking changes in:\n- React\n- TypeScript\n- Build tools',
  'Quick fix needed for the `authentication` module.\n\nSee related issue: [#123](https://github.com/example/issues/123)',
  'Normal description without any special formatting.',
  '**High Priority**\n\nThis affects production. Please review the `config.ts` file and ensure all environment variables are set correctly.',
];

function generateTasks(count: number): Row[] {
  const baseDate = new Date('2024-03-01T00:00:00Z');
  return Array.from({ length: count }, (_, i) => {
    const title = taskTitles[i % taskTitles.length];
    const priorities = ['low', 'medium', 'high'];
    const taskStatuses = ['todo', 'in_progress', 'done'];
    const priority = priorities[i % priorities.length];
    const status = taskStatuses[i % taskStatuses.length];
    const completed = status === 'done';
    const day = (i % 28) + 1;
    const dueDate = new Date(2024, 6, day).toISOString().split('T')[0];

    const numLabels = i % 3;
    const labels: string[] = [];
    for (let l = 0; l < numLabels; l++) {
      const label = labelOptions[(i + l) % labelOptions.length];
      if (!labels.includes(label)) {
        labels.push(label);
      }
    }

    const attachments = generateTaskAttachments(i + 1);
    const description = markdownDescriptions[i % markdownDescriptions.length];
    const timestamp = new Date(baseDate.getTime() + i * 3600000).toISOString();

    return {
      id: `task-${i + 1}`,
      fields: {
        title: `${title} #${i + 1}`,
        description,
        priority,
        status,
        labels: labels.length > 0 ? labels : null,
        due_date: dueDate,
        completed,
        attachments,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
}

// =============================================================================
// Export Sample Data
// =============================================================================

export interface SampleData {
  bases: BaseSpec[];
  rows: Map<string, Row[]>;
}

export function generateSampleData(): SampleData {
  const contactsTable: TableSpec = {
    id: 'contacts',
    label: 'Contacts',
    fields: contactsFields,
    primaryFieldId: 'name',
  };

  const tasksTable: TableSpec = {
    id: 'tasks',
    label: 'Tasks',
    fields: tasksFields,
    primaryFieldId: 'title',
  };

  const demoBase: BaseSpec = {
    id: 'demo',
    label: 'Demo Base',
    tables: [contactsTable, tasksTable],
  };

  const rows = new Map<string, Row[]>();
  rows.set('demo:contacts', generateContacts(100));
  rows.set('demo:tasks', generateTasks(50));

  return {
    bases: [demoBase],
    rows,
  };
}
