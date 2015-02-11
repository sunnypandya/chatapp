from django import template

from friendship.models import Friend

register = template.Library()


@register.inclusion_tag('friendship/templatetags/friends.html')
def friends(user):
    """
    Simple tag to grab all friends
    """
    
    return {'friends': Friend.objects.friends(user)}


@register.inclusion_tag('friendship/templatetags/friend_requests.html')
def friend_requests(user):
    """
    Inclusion tag to display friend requests
    """
    return {'friend_requests': Friend.objects.requests(user)}


@register.inclusion_tag('friendship/templatetags/friend_request_count.html')
def friend_request_count(user):
    """
    Inclusion tag to display the count of unread friend requests
    """
    return {'friend_request_count': Friend.objects.unread_request_count(user)}
