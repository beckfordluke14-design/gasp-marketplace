-- 8. Video Generation Jobs (Async Tracker)
CREATE TABLE IF NOT EXISTS video_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT UNIQUE NOT NULL, -- Remote Job ID (e.g. from xAI/Grok)
    persona_id TEXT REFERENCES personas(id),
    visual_category TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    temp_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Index
CREATE INDEX IF NOT EXISTS idx_video_jobs_lookup ON video_jobs(job_id);

