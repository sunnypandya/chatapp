from django.contrib.auth.decorators import login_required
from django.conf import settings
from mongoengine.django.auth import User
user_model = User
import pymongo
from bson.objectid import ObjectId
from django.shortcuts import render, get_object_or_404, redirect
from mongoengine.django.shortcuts import get_document_or_404

from friendship.exceptions import AlreadyExistsError
from friendship.models import Friend, FriendshipRequest

get_friendship_context_object_name = lambda: getattr(settings, 'FRIENDSHIP_CONTEXT_OBJECT_NAME', 'user')
get_friendship_context_object_list_name = lambda: getattr(settings, 'FRIENDSHIP_CONTEXT_OBJECT_LIST_NAME', 'users')


def view_friends(request, username, template_name='friendship/friend/user_list.html'):
    """ View the friends of a user """

    user=User.objects.get(username=username)
    friends = Friend.objects.friends(user)

    return render(request, template_name, {get_friendship_context_object_name(): user, 'friends': friends})

@login_required
def friendship_add_friend(request, to_username, template_name='friendship/friend/add.html'):
    """ Create a FriendshipRequest """
    ctx = {'to_username': to_username}

    if request.method == 'POST':
        to_user = user_model.objects.get(username=to_username)
        from_user = request.user

        try:
            Friend.objects.add_friend(from_user, to_user)
        except AlreadyExistsError as e:
            ctx['errors'] = ["%s" % e]
        else:
            return redirect('friendship_request_list')

    return render(request, template_name, ctx)

@login_required
def friendship_accept(request, friendship_request_id):
    """ Accept a friendship request """
    testin=ObjectId(friendship_request_id)
    if request.method == 'POST':
        try:
            f_request= FriendshipRequest.objects.get(pk=testin)
        except FriendshipRequest.DoesNotExist:
            raise Http404

        f_request.accept()
        return redirect('friendship_view_friends', username=request.user.username)

    return redirect('friendship_requests_detail', friendship_request_id=friendship_request_id)


@login_required
def friendship_reject(request, friendship_request_id):
    """ Reject a friendship request """
    if request.method == 'POST':
        f_request = get_object_or_404(
            request.user.friendship_requests_received,
            id=friendship_request_id)
        f_request.reject()
        return redirect('friendship_request_list')

    return redirect('friendship_requests_detail', friendship_request_id=friendship_request_id)


@login_required
def friendship_cancel(request, friendship_request_id):
    """ Cancel a previously created friendship_request_id """
    if request.method == 'POST':
        f_request = get_object_or_404(
            request.user.friendship_requests_sent,
            id=friendship_request_id)
        f_request.cancel()
        return redirect('friendship_request_list')

    return redirect('friendship_requests_detail', friendship_request_id=friendship_request_id)


@login_required
def friendship_request_list(request, template_name='friendship/friend/requests_list.html'):
    """ View unread and read friendship requests """
    # friendship_requests = Friend.objects.requests(request.user)
    friendship_requests = FriendshipRequest.objects.filter(rejected__isnull=True)

    return render(request, template_name, {'requests': friendship_requests})


@login_required
def friendship_request_list_rejected(request, template_name='friendship/friend/requests_list.html'):
    """ View rejected friendship requests """
    # friendship_requests = Friend.objects.rejected_requests(request.user)
    friendship_requests = FriendshipRequest.objects.filter(rejected__isnull=True)

    return render(request, template_name, {'requests': friendship_requests})


@login_required
def friendship_requests_detail(request, friendship_request_id, template_name='friendship/friend/request.html'):
    """ View a particular friendship request """
    testin=ObjectId(friendship_request_id)
    f_request = get_object_or_404(FriendshipRequest, id=testin)

    return render(request, template_name, {'friendship_request': f_request})

def all_users(request, template_name="friendship/user_actions.html"):
    users = user_model.objects.all()

    return render(request, template_name, {get_friendship_context_object_list_name(): users})