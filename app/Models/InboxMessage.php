<?php

namespace App\Models;

use App\Enums\InboxMessageType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InboxMessage extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'body',
        'action_url',
        'action_label',
        'meta',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => InboxMessageType::class,
            'meta' => 'array',
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isUnread(): bool
    {
        return $this->read_at === null;
    }

    public function markAsRead(): void
    {
        if ($this->read_at !== null) {
            return;
        }

        $this->forceFill(['read_at' => now()])->save();
    }

    /**
     * @param  array<string, mixed>|null  $meta
     */
    public static function notify(
        User $user,
        InboxMessageType $type,
        string $title,
        string $body,
        ?string $actionUrl = null,
        ?string $actionLabel = null,
        ?array $meta = null,
    ): self {
        return static::query()->create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'action_url' => $actionUrl,
            'action_label' => $actionLabel,
            'meta' => $meta,
        ]);
    }
}
