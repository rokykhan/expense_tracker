import { visibleNotes } from '@/features/notes/domain/notes';

describe('visible notes', () => {
  const notes = [
    { title: 'বাজার', body: 'দুধ', isPinned: false, updatedAt: '2026-11-02T00:00:00.000Z' },
    { title: 'ভাড়া', body: 'রসিদ', isPinned: true, updatedAt: '2026-11-01T00:00:00.000Z' },
    { title: 'চা', body: 'বাজারের দোকান', isPinned: false, updatedAt: '2026-11-03T00:00:00.000Z' },
  ];

  it('pins first and searches the title and body', () => {
    expect(visibleNotes(notes, '').map((note) => note.title)).toEqual(['ভাড়া', 'চা', 'বাজার']);
    expect(visibleNotes(notes, 'বাজার').map((note) => note.title)).toEqual(['চা', 'বাজার']);
  });
});
