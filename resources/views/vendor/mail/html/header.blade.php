@props(['url'])
{{-- Ours instead of the framework's: that one prints a logo fetched from laravel.com whenever the app is called
     „Laravel“ — what an installation without APP_NAME is called. No mail of the shop carries an image (D-218). --}}
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
{!! $slot !!}
</a>
</td>
</tr>
