CREATE TABLE public.live_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  difficulty text NOT NULL,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_score integer,
  technical_score integer,
  communication_score integer,
  confidence_score integer,
  grammar_score integer,
  clarity_score integer,
  strengths text[],
  weaknesses text[],
  suggestions text[],
  improved_answers jsonb DEFAULT '[]'::jsonb,
  summary text,
  recording_url text,
  status text NOT NULL DEFAULT 'in_progress',
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.live_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own live" ON public.live_interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own live" ON public.live_interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own live" ON public.live_interviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own live" ON public.live_interviews FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for interview recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('interview-recordings', 'interview-recordings', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users read own recordings" ON storage.objects FOR SELECT
  USING (bucket_id = 'interview-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users upload own recordings" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'interview-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users delete own recordings" ON storage.objects FOR DELETE
  USING (bucket_id = 'interview-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);