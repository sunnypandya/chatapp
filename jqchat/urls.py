# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url, include
import views

urlpatterns = patterns('',
    # Example chat room.
    url(r"room/(?P<id>\w+)/ajax/$", views.BasicAjaxHandler, name="jqchat_ajax"),
    url(r"room/(?P<id>\w+)/$", views.window, name="jqchat_test_window"),
    # Second example room - adds room descriptions.
    #url(r"room_with_description/(?P<id>\d+)/$", views.WindowWithDescription, name="jqchat_test_window_with_description"),
    #url(r"room_with_description/(?P<id>\d+)/ajax/$", views.WindowWithDescriptionAjaxHandler, name="jqchat_test_window_with_description_ajax"),
    url(r"getchats/", 'qchat.views.get_chat_list', name='get_chat_list'),
    url(r'create_group/', 'qchat.views.create_group_chat', name='create_group_chat')
)