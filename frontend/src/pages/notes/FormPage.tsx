import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes } from '../../hooks/useNotes';
import { Button } from '../../components/ui/Button';
import { RichTextEditor } from '../../components/editor/RichTextEditor';
import { Spinner } from '../../components/ui/Spinner';
import { ArrowLeft } from 'lucide-react';

const schema = z.object({
  title: z.string().min(3, 'Title is too short').max(255),
  body: z.string().min(10, 'Body needs more substance').max(10000),
  tags: z.array(z.enum(['work', 'personal', 'life'])),
});

type NoteFormData = z.infer<typeof schema>;

export const FormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { useGetById, create, update } = useNotes();
  const { data: rawNoteData, isLoading: isNoteLoading } = useGetById(id || '');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      body: '',
      tags: ['work'],
    },
  });

  const selectedTags = useWatch({ control, name: 'tags' }) || ['work'];

  useEffect(() => {
    if (isEdit && rawNoteData?.data) {
      const note = rawNoteData.data;
      setValue('title', note.title);
      setValue('body', note.body);
      setValue('tags', note.tags || ['work']);
    }
  }, [isEdit, rawNoteData, setValue]);

  const toggleTag = (tag: 'work' | 'personal' | 'life') => {
    const current = [...selectedTags];
    const index = current.indexOf(tag);
    if (index > -1) {
      if (current.length > 1) current.splice(index, 1);
    } else {
      current.push(tag);
    }
    setValue('tags', current, { shouldValidate: true });
  };

  const onSubmit = async (formData: NoteFormData) => {
    if (isEdit && id) {
      await update({ id, data: formData });
      navigate(`/notes/${id}`);
    } else {
      await create(formData);
      navigate('/dashboard');
    }
  };

  if (isEdit && isNoteLoading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex items-center justify-between border-b border-outline-variant pb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface font-extrabold text-sm transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Cancel & Return
        </button>
        <h1 className="text-xl font-extrabold text-on-surface">
          {isEdit ? 'Edit Note' : 'Create New Note'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="note-title" className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
            Note Title
          </label>
          <input
            id="note-title"
            {...register('title')}
            type="text"
            placeholder="e.g. Architecture Decisions for Q3"
            className="w-full bg-surface border border-outline-variant px-5 py-3.5 rounded-2xl text-lg font-bold text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
          />
          {errors.title && <p className="text-xs font-bold text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
            Category Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {(['work', 'personal', 'life'] as const).map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-surface-container text-on-surface-variant border border-outline-variant hover:bg-surface-hover'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          {errors.tags && <p className="text-xs font-bold text-red-500">{errors.tags.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
            Note Content
          </label>
          <Controller
            name="body"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Type your notes here..."
              />
            )}
          />
          {errors.body && <p className="text-xs font-bold text-red-500">{errors.body.message}</p>}
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-outline-variant">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            Discard
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="px-8"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-semantic)' }}
          >
            {isEdit ? 'Save Changes' : 'Publish Note'}
          </Button>
        </div>
      </form>
    </div>
  );
};
