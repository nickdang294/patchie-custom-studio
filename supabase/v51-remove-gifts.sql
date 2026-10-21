-- Optional cleanup; saving any admin settings also removes these obsolete keys.
-- Historical orders are preserved. No schema changes required.
DELETE FROM public.settings WHERE key IN ('giftOffer','popupCampaigns','activePopupCampaign','halloweenThemeEnabled','halloweenFeatures');
