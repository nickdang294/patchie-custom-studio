-- Run once on an existing Patchie project to add configurable popup campaigns.
insert into public.settings(key,value) values
('activePopupCampaign','"traditional-gift"'::jsonb),
('popupCampaigns','[{"id":"traditional-gift","type":"traditional","enabled":true,"eyebrow":"QUÀ NHỎ KHAI TRƯƠNG","title":"Nhân dịp khai trương, tụi mình tặng bạn 1 patch làm quen","description":"Bạn thích patch nào thì chọn heee 💖","buttonLabel":"Nhận patch này","patchIds":["patch-pink","patch-black"]},{"id":"halloween-tarot","type":"tarot","enabled":false,"eyebrow":"HALLOWEEN TAROT","title":"Lá bài nào đang gọi tên bạn?","description":"Chọn một lá bài để lật ra patch miễn phí của riêng bạn.","buttonLabel":"Nhận patch này","patchIds":["patch-pink","patch-black","patch-red"],"cards":[{"id":"ghost","label":"The Ghost","patchId":"patch-pink"},{"id":"witch","label":"The Witch","patchId":"patch-black"},{"id":"monster","label":"The Monster","patchId":"patch-red"}]}]'::jsonb)
on conflict (key) do nothing;
