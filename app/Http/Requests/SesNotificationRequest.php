<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\MailSetting;
use App\Services\Mail\SnsMessage;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * A message Amazon SNS posts to /webhooks/ses. SNS sends JSON as text/plain, so the body is read as it came. Nobody is
 * signed in: the authorization is the message itself — signed by SNS (SnsMessage::verified), from the topic entered in
 * Einstellungen › E-Mail. No topic entered, nothing accepted: a webhook nobody set up answers nobody.
 */
class SesNotificationRequest extends FormRequest
{
    private ?SnsMessage $message = null;

    public function authorize(): bool
    {
        $message = $this->message();
        $topics = MailSetting::query()->whereNotNull('topic_arn')->pluck('topic_arn')->all();

        return $message !== null && $topics !== [] && in_array($message->field('TopicArn'), $topics, true) && $message->verified();
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'Type' => ['required', 'string', 'in:Notification,SubscriptionConfirmation,UnsubscribeConfirmation'],
            'MessageId' => ['required', 'string', 'max:100'],
            'TopicArn' => ['required', 'string', 'max:256', 'regex:/^arn:aws:sns:[a-z0-9-]+:\d{12}:[A-Za-z0-9_-]+$/'],
            'Message' => ['required', 'string'],
            'Timestamp' => ['required', 'string'],
            'SignatureVersion' => ['required', 'in:1,2'],
            'Signature' => ['required', 'string'],
            'SigningCertURL' => ['required', 'string', 'url:https'],
            'SubscribeURL' => ['required_unless:Type,Notification', 'string', 'url:https'],
        ];
    }

    /** @return array<string, mixed> */
    public function validationData(): array
    {
        return $this->message()->fields ?? [];
    }

    public function message(): ?SnsMessage
    {
        return $this->message ??= SnsMessage::fromBody((string) $this->getContent());
    }

    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(response()->json(['received' => false, 'error' => 'not from the configured SNS topic'], 403));
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json(['received' => false, 'error' => 'not an SNS message'], 400));
    }
}
