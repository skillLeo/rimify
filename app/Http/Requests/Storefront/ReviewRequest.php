<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Models\Order;
use App\Services\Commerce\Reviews\ReviewWriter;
use Illuminate\Foundation\Http\FormRequest;

/**
 * A buyer's ratings for the rims of one order (D-103). The route is signed — the signature in the invitation is the
 * proof of purchase — and this request is its policy check: only a delivered, real order may be reviewed. Each rating is
 * a whole number of stars, 1 to 5; the sentence is optional. Which lines belong to the order is ReviewWriter's question.
 */
class ReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $order = $this->order();

        return $order !== null && ReviewWriter::open($order);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'reviews' => ['required', 'array', 'min:1'],
            'reviews.*.rating' => ['required', 'integer', 'between:1,5'],
            'reviews.*.body' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'reviews.required' => 'Gib mindestens einer Felge Sterne.',
            'reviews.min' => 'Gib mindestens einer Felge Sterne.',
            'reviews.*.rating.*' => 'Wähle zwischen einem und fünf Sternen.',
            'reviews.*.body.max' => 'Dein Text darf höchstens 1.000 Zeichen lang sein.',
        ];
    }

    public function order(): ?Order
    {
        $number = $this->route('number');

        return is_string($number) ? Order::query()->where('order_number', $number)->first() : null;
    }

    /** @return array<int|string, array{rating: int, body?: string|null}> */
    public function ratings(): array
    {
        $out = [];

        foreach ((array) $this->validated('reviews') as $line => $review) {
            if (is_array($review)) {
                $out[$line] = ['rating' => (int) $review['rating'], 'body' => isset($review['body']) && is_string($review['body']) ? $review['body'] : null];
            }
        }

        return $out;
    }
}
