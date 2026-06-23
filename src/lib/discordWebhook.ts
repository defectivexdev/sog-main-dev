interface WebhookEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface WebhookPayload {
  title: string;
  description?: string;
  color?: number; // Decimal color (e.g., 0x34d399)
  fields?: WebhookEmbedField[];
  imageUrl?: string;
  thumbnailUrl?: string;
}

export async function sendDiscordWebhook(webhookUrl: string | null | undefined, payload: WebhookPayload) {
  if (!webhookUrl || webhookUrl.trim() === "") return false;

  const embed: any = {
    title: payload.title,
    color: payload.color || 0xc9a227, // Default Gold
    timestamp: new Date().toISOString(),
  };

  if (payload.description) embed.description = payload.description;
  if (payload.fields && payload.fields.length > 0) embed.fields = payload.fields;
  if (payload.imageUrl) embed.image = { url: payload.imageUrl };
  if (payload.thumbnailUrl) embed.thumbnail = { url: payload.thumbnailUrl };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed]
      })
    });
    
    return res.ok;
  } catch (error) {
    console.error("Error sending webhook:", error);
    return false;
  }
}
