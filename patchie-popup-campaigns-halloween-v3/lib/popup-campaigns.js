export const DEFAULT_POPUP_CAMPAIGNS = [
  {
    id: 'traditional-gift',
    type: 'traditional',
    enabled: true,
    eyebrow: 'QUÀ NHỎ KHAI TRƯƠNG',
    title: 'Nhân dịp khai trương, tụi mình tặng bạn 1 patch làm quen',
    description: 'Bạn thích patch nào thì chọn heee 💖',
    buttonLabel: 'Nhận patch này',
    patchIds: ['patch-pink', 'patch-black']
  },
  {
    id: 'halloween-tarot',
    type: 'tarot',
    enabled: false,
    eyebrow: 'HALLOWEEN TAROT',
    title: 'Lá bài nào đang gọi tên bạn?',
    description: 'Chọn một lá bài để lật ra patch miễn phí của riêng bạn.',
    buttonLabel: 'Nhận patch này',
    patchIds: ['patch-pink', 'patch-black', 'patch-red'],
    cards: [
      { id: 'ghost', label: 'The Ghost', patchId: 'patch-pink' },
      { id: 'witch', label: 'The Witch', patchId: 'patch-black' },
      { id: 'monster', label: 'The Monster', patchId: 'patch-red' }
    ]
  }
];

export function normalizePopupCampaigns(campaigns, legacyGift = {}) {
  if (Array.isArray(campaigns) && campaigns.length) {
    return campaigns.map((campaign, index) => ({
      ...DEFAULT_POPUP_CAMPAIGNS[index % DEFAULT_POPUP_CAMPAIGNS.length],
      ...campaign,
      id: String(campaign?.id || `campaign-${index + 1}`),
      type: campaign?.type === 'tarot' ? 'tarot' : 'traditional',
      patchIds: Array.isArray(campaign?.patchIds) ? campaign.patchIds.filter(Boolean) : [],
      cards: Array.isArray(campaign?.cards) ? campaign.cards.map((card, cardIndex) => ({
        id: String(card?.id || `card-${cardIndex + 1}`),
        label: String(card?.label || `The Card ${cardIndex + 1}`),
        patchId: String(card?.patchId || '')
      })) : []
    }));
  }

  return DEFAULT_POPUP_CAMPAIGNS.map((campaign, index) => index === 0
    ? {
        ...campaign,
        enabled: legacyGift.enabled !== false,
        eyebrow: legacyGift.eyebrow || campaign.eyebrow,
        title: legacyGift.title || campaign.title,
        description: legacyGift.description || campaign.description,
        buttonLabel: legacyGift.buttonLabel || campaign.buttonLabel,
        patchIds: Array.isArray(legacyGift.patchIds) && legacyGift.patchIds.length
          ? legacyGift.patchIds.filter(Boolean)
          : campaign.patchIds
      }
    : { ...campaign });
}

export function getActivePopupCampaign(campaigns, activeId) {
  const list = Array.isArray(campaigns) ? campaigns : [];
  return list.find(campaign => campaign.id === activeId && campaign.enabled)
    || list.find(campaign => campaign.enabled)
    || null;
}

export function campaignPatchIds(campaign) {
  if (!campaign) return [];
  if (campaign.type === 'tarot') {
    return Array.from(new Set((campaign.cards || []).map(card => card.patchId).filter(Boolean)));
  }
  return Array.from(new Set((campaign.patchIds || []).filter(Boolean)));
}
