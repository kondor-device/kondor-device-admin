export const REVIEW_FIELDS = `_id,_type,_rev,item,author,rating,text,status,submittedAt,reply,"itemName":coalesce(item->name,"Товар не знайдено")`
export const PRODUCTS_QUERY = `*[_type == "item" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && showonmain != true] | order(name asc){_id,name}`
export const REVIEW_QUERY = `*[_type == "review" && _id == $id][0]{${REVIEW_FIELDS},photos,"phone":coalesce(phone,*[_id == "reviewContact." + $id][0].phone)}`
export const HISTORY_QUERY = `{
  "recent": *[_type == "reviewAudit" && reviewId == $id] | order(_createdAt desc, _id desc)[0...30],
  "first": *[_type == "reviewAudit" && reviewId == $id] | order(_createdAt asc, _id asc)[0]
}`
export function reviewListQuery(page: number) {
  if (!Number.isInteger(page) || page < 0 || page > 100000) throw new Error('Некоректна сторінка')
  const filter = `_type == "review" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && ($itemId == "all" || item._ref == $itemId) && ($search == "" || author match $search || text match $search)`
  return `{
    "counts": {${['pending', 'approved', 'hidden', 'rejected'].map((status) => `"${status}":count(*[${filter} && status == "${status}"])`).join(',')}},
    "total": count(*[${filter} && ($status == "all" || status == $status)]),
    "reviews": *[${filter} && ($status == "all" || status == $status)] | order(submittedAt desc, _id asc)[${page * 30}...${page * 30 + 30}]{${REVIEW_FIELDS}}
  }`
}
