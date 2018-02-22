$(document).ready(function(){
	$('.delete-article').on('click',function(e){
		$target = $(e.target);
		var id = $target.attr('data-id');
		$.ajax({
			type:'DELETE',
			success: function(response){
				alert('Deleting Article');
				window.location.href='/';
			},
			error:function(err){
				console.log(err);
			}
		});
	});
});
